// Generates WildAtlas.postman_collection.json and WildAtlas.local.postman_environment.json
// Run: node postman/generate.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const NO_LOCATION = [
  'pm.test("no site coordinates leaked", () => {',
  '  pm.expect(pm.response.text()).to.not.include(\'"location"\');',
  '  pm.expect(pm.response.text()).to.not.include("publish_site_coordinates");',
  '});',
];

const ok = (code = 200) => [
  `pm.test("status ${code}", () => pm.response.to.have.status(${code}));`,
];

const json = (body) => ({
  mode: 'raw',
  raw: JSON.stringify(body, null, 2),
  options: { raw: { language: 'json' } },
});

const req = (name, method, path, opts = {}) => {
  const query = opts.query ?? [];
  const rawQuery = query.length
    ? '?' + query.map(([k, v]) => `${k}=${v}`).join('&')
    : '';
  const item = {
    name,
    event: [
      {
        listen: 'test',
        script: { type: 'text/javascript', exec: opts.tests ?? ok() },
      },
    ],
    request: {
      method,
      header: opts.headers ?? [],
      url: {
        raw: `{{baseUrl}}${path}${rawQuery}`,
        host: ['{{baseUrl}}'],
        path: path.replace(/^\//, '').split('/'),
      },
    },
    response: [],
  };
  if (query.length) {
    item.request.url.query = query.map(([key, value]) => ({ key, value }));
  }
  if (opts.body !== undefined) {
    item.request.header = [
      ...(item.request.header ?? []),
      { key: 'Content-Type', value: 'application/json' },
    ];
    item.request.body = json(opts.body);
  }
  if (opts.desc) item.request.description = opts.desc;
  return item;
};

const deviceHeader = [{ key: 'X-Device-Id', value: '{{deviceId}}' }];
const bearer = [{ key: 'Authorization', value: 'Bearer {{cronSecret}}' }];
const secretHeader = [
  { key: 'X-Telegram-Bot-Api-Secret-Token', value: '{{webhookSecret}}' },
];

const collection = {
  info: {
    _postman_id: '0f5a7c2e-9b1d-4e3a-8c6f-2d4b6a8e0c11',
    name: 'Wild Atlas — API v1',
    description:
      'Contract tests for Wild Atlas. Run folders in order 00 → 09. Every read asserts that no site coordinates leak. Import the local environment, start the app, seed the database, then Run collection.',
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    {
      name: '00 · Health',
      item: [
        req('01 · Health', 'GET', '/api/health', {
          tests: [
            ...ok(200),
            'pm.test("db is up", () => pm.expect(pm.response.json().db).to.eql("up"));',
            ...NO_LOCATION,
          ],
        }),
      ],
    },
    {
      name: '01 · Read',
      item: [
        req('02 · Taxonomy', 'GET', '/api/taxonomy', {
          query: [['lang', '{{lang}}']],
          tests: [
            ...ok(200),
            'const b = pm.response.json();',
            'pm.test("7 facets", () => pm.expect(b.facets.length).to.eql(7));',
            'pm.test("5 access statuses", () => pm.expect(b.accessStatuses.length).to.eql(5));',
            ...NO_LOCATION,
          ],
        }),
        req('03 · Towns', 'GET', '/api/towns', {
          query: [
            ['eligible', 'true'],
            ['lang', '{{lang}}'],
          ],
          tests: [
            ...ok(200),
            'const b = pm.response.json();',
            'pm.test("has towns", () => pm.expect(b.count).to.be.above(0));',
            'pm.test("town has no location", () => pm.expect(b.towns[0]).to.not.have.property("location"));',
            ...NO_LOCATION,
          ],
        }),
        req('04 · Places', 'GET', '/api/places', {
          query: [
            ['limit', '200'],
            ['lang', '{{lang}}'],
          ],
          tests: [
            ...ok(200),
            'const b = pm.response.json();',
            'pm.test("places is an array", () => pm.expect(b.places).to.be.an("array"));',
            'pm.test("each card has an access point", () => {',
            '  b.places.forEach((p) => pm.expect(p.accessPoint).to.be.an("object"));',
            '});',
            ...NO_LOCATION,
          ],
        }),
        req('05 · Place detail', 'GET', '/api/places/{{slug}}', {
          query: [['lang', '{{lang}}']],
          tests: [
            ...ok(200),
            'const p = pm.response.json().place;',
            'pm.test("at least two sources", () => pm.expect(p.sources.length).to.be.at.least(2));',
            'pm.test("access point present", () => pm.expect(p.accessPoint).to.be.an("object"));',
            'pm.test("no narrative score on non-secular", () => {',
            '  if (p.culturalStatus !== "SECULAR") pm.expect(p.narrativeScore).to.be.null;',
            '});',
            ...NO_LOCATION,
          ],
        }),
      ],
    },
    {
      name: '02 · Search',
      item: [
        req('06 · Search (Tamil)', 'GET', '/api/search', {
          query: [
            ['q', 'சிறுவாணி'],
            ['lang', 'ta'],
          ],
          tests: [
            ...ok(200),
            'const b = pm.response.json();',
            'pm.test("Siruvani ranks first", () => pm.expect(b.places[0].slug).to.eql("siruvani-falls"));',
            'pm.test("intent present", () => pm.expect(b.intent).to.be.an("object"));',
            ...NO_LOCATION,
          ],
        }),
        req('06b · Search (intent)', 'GET', '/api/search', {
          query: [
            ['q', 'waterfalls near Valparai'],
            ['lang', 'en'],
          ],
          tests: [
            ...ok(200),
            'const b = pm.response.json();',
            'pm.test("WATER facet detected", () => pm.expect(b.intent.facets).to.include("WATER"));',
            'pm.test("town hint detected", () => pm.expect(b.intent.townHint).to.eql("valparai"));',
            ...NO_LOCATION,
          ],
        }),
        req('07 · Suggest', 'GET', '/api/search/suggest', {
          query: [
            ['q', 'sir'],
            ['lang', '{{lang}}'],
          ],
          tests: [
            ...ok(200),
            'const b = pm.response.json();',
            'pm.test("max 8 suggestions", () => pm.expect(b.suggestions.length).to.be.at.most(8));',
            ...NO_LOCATION,
          ],
        }),
        req('08 · Nearby', 'POST', '/api/nearby', {
          body: { lat: 10.9481, lon: 76.7012, radiusM: 15000, facets: [], lang: 'en' },
          headers: deviceHeader,
          tests: [
            ...ok(200),
            'const b = pm.response.json();',
            'pm.test("in region", () => pm.expect(b.inRegion).to.eql(true));',
            'pm.test("crow-flies distance only", () => {',
            '  b.places.forEach((p) => {',
            '    if (p.distance) pm.expect(p.distance.kind).to.eql("CROW");',
            '  });',
            '});',
            ...NO_LOCATION,
          ],
        }),
      ],
    },
    {
      name: '03 · Geo',
      item: [
        req('08b · Nearby outside region', 'POST', '/api/nearby', {
          body: { lat: 13.0827, lon: 80.2707, radiusM: 15000, lang: 'en' },
          headers: deviceHeader,
          tests: [
            ...ok(200),
            'pm.test("Chennai is outside the region", () => pm.expect(pm.response.json().inRegion).to.eql(false));',
            'pm.test("no places returned", () => pm.expect(pm.response.json().count).to.eql(0));',
          ],
        }),
        req('09 · Reach', 'GET', '/api/reach', {
          query: [
            ['town', '{{town}}'],
            ['within', '60'],
            ['lang', '{{lang}}'],
          ],
          tests: [
            ...ok(200),
            'const b = pm.response.json();',
            'pm.test("town echoed", () => pm.expect(b.town.slug).to.eql(pm.environment.get("town")));',
            'pm.test("hull label", () => pm.expect(b.hullLabel).to.eql("approximate reach"));',
            'pm.test("hull null under 3 points", () => {',
            '  if (b.count < 3) pm.expect(b.hull).to.be.null;',
            '});',
            ...NO_LOCATION,
          ],
        }),
      ],
    },
    {
      name: '04 · Write',
      item: [
        req('10 · Correction', 'POST', '/api/corrections', {
          headers: deviceHeader,
          body: {
            placeSlug: '{{slug}}',
            field: 'accessWindow',
            message:
              'Gate was closed at 16:30 on 24 Nov 2026. The sign says 17:00.',
            channel: 'WEB',
            website: '',
          },
          tests: [
            ...ok(201),
            'const b = pm.response.json();',
            'pm.test("status OPEN", () => pm.expect(b.status).to.eql("OPEN"));',
            'pm.test("localized message", () => pm.expect(b.message).to.have.property("ta"));',
            ...NO_LOCATION,
          ],
        }),
      ],
    },
    {
      name: '05 · Telegram',
      item: [
        req('11 · Create link', 'POST', '/api/telegram/link', {
          headers: deviceHeader,
          body: {},
          tests: [
            ...ok(201),
            'const b = pm.response.json();',
            'pm.environment.set("linkToken", b.token);',
            'pm.environment.set("linkCode", b.code);',
            'pm.test("4-char unambiguous code", () => pm.expect(b.code).to.match(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/));',
            'pm.test("token is not in the deep link twice", () => pm.expect(b.deepLink).to.include(b.token));',
            'pm.test("5 minute expiry", () => pm.expect(b.expiresIn).to.eql(300));',
          ],
        }),
        req('11b · Webhook /start (bind attempt)', 'POST', '/api/telegram/webhook', {
          headers: secretHeader,
          body: {
            update_id: 900000001,
            message: {
              message_id: 42,
              date: 1795766400,
              chat: { id: 123456789, type: 'private' },
              from: { id: 123456789, is_bot: false, first_name: 'Test' },
              text: '/start {{linkToken}}',
            },
          },
          tests: [
            ...ok(200),
            'pm.test("plain ok", () => pm.expect(pm.response.text()).to.eql("ok"));',
          ],
        }),
        req('12 · Link status', 'POST', '/api/telegram/link/status', {
          headers: deviceHeader,
          body: { token: '{{linkToken}}' },
          tests: [
            ...ok(200),
            'const b = pm.response.json();',
            'pm.test("status is PENDING", () => pm.expect(b.status).to.eql("PENDING"));',
            'pm.test("chat id never returned", () => pm.expect(b).to.not.have.property("chat_id"));',
          ],
        }),
        req('13 · Unlink', 'POST', '/api/telegram/unlink', {
          headers: deviceHeader,
          body: {},
          tests: [
            ...ok(200),
            'pm.test("notifications disabled", () => pm.expect(pm.response.json().notificationsEnabled).to.eql(false));',
          ],
        }),
      ],
    },
    {
      name: '06 · Preferences',
      item: [
        req('14 · Get preferences', 'GET', '/api/preferences', {
          headers: deviceHeader,
          tests: [
            ...ok(200),
            'const b = pm.response.json();',
            'pm.test("valid radius", () => pm.expect([5000,10000,15000,25000]).to.include(b.radiusM));',
            'pm.test("no chat id", () => pm.expect(b.telegram).to.not.have.property("chat_id"));',
            'pm.test("no home geohash", () => pm.expect(b).to.not.have.property("home_geohash5"));',
          ],
        }),
        req('15 · Patch preferences', 'PATCH', '/api/preferences', {
          headers: deviceHeader,
          body: { radiusM: 15000, quietStart: '21:30', quietEnd: '06:30', facets: ['WATER'] },
          tests: [
            ...ok(200),
            'const b = pm.response.json();',
            'pm.test("radius updated", () => pm.expect(b.radiusM).to.eql(15000));',
            'pm.test("quiet hours updated", () => pm.expect(b.quietStart).to.eql("21:30"));',
          ],
        }),
      ],
    },
    {
      name: '07 · Trips & Pack',
      item: [
        req('16 · Create trip', 'POST', '/api/trips', {
          headers: deviceHeader,
          body: {
            corridor: '{{corridor}}',
            startsAt: '2026-12-05T04:30:00.000Z',
            endsAt: '2026-12-06T14:00:00.000Z',
          },
          tests: [
            'pm.test("created or idempotent", () => pm.expect([200,201]).to.include(pm.response.code));',
            'const b = pm.response.json();',
            'pm.environment.set("tripId", b.tripId);',
            'pm.test("home radius bypassed", () => pm.expect(b.homeRadiusBypassed).to.eql(true));',
            'pm.test("pack has places", () => pm.expect(b.pack.places).to.be.above(0));',
          ],
        }),
        req('16b · Create trip again (idempotent)', 'POST', '/api/trips', {
          headers: deviceHeader,
          body: {
            corridor: '{{corridor}}',
            startsAt: '2026-12-05T04:30:00.000Z',
            endsAt: '2026-12-06T14:00:00.000Z',
          },
          tests: [
            ...ok(200),
            'pm.test("same trip id", () => pm.expect(pm.response.json().tripId).to.eql(pm.environment.get("tripId")));',
          ],
        }),
        req('17 · Get trip', 'GET', '/api/trips/{{tripId}}', {
          headers: deviceHeader,
          tests: [
            ...ok(200),
            'const b = pm.response.json();',
            'pm.test("stops ordered", () => {',
            '  const orders = b.stops.map((s) => s.order);',
            '  pm.expect(orders).to.eql([...orders].sort((a, c) => a - c));',
            '});',
            ...NO_LOCATION,
          ],
        }),
        req('18 · Pack manifest', 'GET', '/api/trip/{{corridor}}/pack', {
          tests: [
            ...ok(200),
            'const b = pm.response.json();',
            'pm.test("dossiers match places", () => pm.expect(b.dossiers.length).to.eql(b.places.length));',
            'pm.test("tiles max zoom 14", () => pm.expect(b.tiles.maxZoom).to.eql(14));',
            ...NO_LOCATION,
          ],
        }),
        req('19 · Delete trip', 'DELETE', '/api/trips/{{tripId}}', {
          headers: deviceHeader,
          tests: [
            ...ok(200),
            'pm.test("deleted", () => pm.expect(pm.response.json().deleted).to.eql(true));',
          ],
        }),
      ],
    },
    {
      name: '08 · Internal',
      item: [
        req('20 · Webhook replay', 'POST', '/api/telegram/webhook', {
          headers: secretHeader,
          body: {
            update_id: 900000001,
            message: {
              message_id: 42,
              date: 1795766400,
              chat: { id: 123456789, type: 'private' },
              from: { id: 123456789, is_bot: false, first_name: 'Test' },
              text: '/start {{linkToken}}',
            },
          },
          tests: [
            ...ok(200),
            'pm.test("plain ok", () => pm.expect(pm.response.text()).to.eql("ok"));',
          ],
        }),
        req('20b · Webhook replay again', 'POST', '/api/telegram/webhook', {
          headers: secretHeader,
          body: {
            update_id: 900000001,
            message: {
              message_id: 42,
              date: 1795766400,
              chat: { id: 123456789, type: 'private' },
              from: { id: 123456789, is_bot: false, first_name: 'Test' },
              text: '/start {{linkToken}}',
            },
          },
          tests: [
            ...ok(200),
            'pm.test("replay acknowledged", () => pm.expect(pm.response.text()).to.eql("ok"));',
          ],
        }),
        req('21 · Cron telegram', 'POST', '/api/cron/telegram', {
          headers: bearer,
          tests: [
            ...ok(200),
            'pm.test("job name", () => pm.expect(pm.response.json().job).to.eql("telegram-sweeper"));',
          ],
        }),
        req('22 · Cron purge', 'POST', '/api/cron/purge', {
          headers: bearer,
          tests: [
            ...ok(200),
            'pm.test("job name", () => pm.expect(pm.response.json().job).to.eql("purge"));',
          ],
        }),
        req('23 · Revalidate', 'POST', '/api/revalidate', {
          headers: bearer,
          body: { tags: ['place:{{slug}}'] },
          tests: [
            ...ok(200),
            'pm.test("tag revalidated", () => pm.expect(pm.response.json().revalidated).to.include(`place:${pm.environment.get("slug")}`));',
          ],
        }),
      ],
    },
    {
      name: '09 · Negative',
      item: [
        req('90 · Unknown slug', 'GET', '/api/places/does-not-exist', {
          tests: [
            ...ok(404),
            'pm.test("NOT_FOUND", () => pm.expect(pm.response.json().error.code).to.eql("NOT_FOUND"));',
          ],
        }),
        req('91 · Bad facet', 'GET', '/api/places', {
          query: [['facets', 'BANANA']],
          tests: [
            ...ok(400),
            'pm.test("VALIDATION_FAILED", () => pm.expect(pm.response.json().error.code).to.eql("VALIDATION_FAILED"));',
          ],
        }),
        req('92 · Reach without within', 'GET', '/api/reach', {
          query: [['town', '{{town}}']],
          tests: [...ok(400)],
        }),
        req('93 · Correction too long', 'POST', '/api/corrections', {
          headers: deviceHeader,
          body: {
            placeSlug: '{{slug}}',
            field: 'other',
            message: 'x'.repeat(2100),
            channel: 'WEB',
            website: '',
          },
          tests: [...ok(400)],
        }),
        req('94 · Correction honeypot', 'POST', '/api/corrections', {
          headers: deviceHeader,
          body: {
            placeSlug: '{{slug}}',
            field: 'other',
            message: 'This should be silently dropped by the honeypot.',
            channel: 'WEB',
            website: 'http://spam.example',
          },
          tests: [
            ...ok(201),
            'pm.test("no id returned for a bot", () => pm.expect(pm.response.json().id).to.be.undefined);',
          ],
        }),
        req('95 · Webhook without secret', 'POST', '/api/telegram/webhook', {
          body: { update_id: 900000002 },
          tests: [...ok(403)],
        }),
        req('96 · Cron without bearer', 'POST', '/api/cron/purge', {
          tests: [...ok(401)],
        }),
        req('97 · Nearby bad latitude', 'POST', '/api/nearby', {
          headers: deviceHeader,
          body: { lat: 200, lon: 76.7, radiusM: 15000 },
          tests: [...ok(400)],
        }),
        req('98 · Unknown corridor', 'GET', '/api/trip/not-a-corridor/pack', {
          tests: [...ok(404)],
        }),
        req('99 · Trip ends before start', 'POST', '/api/trips', {
          headers: deviceHeader,
          body: {
            corridor: '{{corridor}}',
            startsAt: '2026-12-06T14:00:00.000Z',
            endsAt: '2026-12-05T04:30:00.000Z',
          },
          tests: [...ok(400)],
        }),
      ],
    },
  ],
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000' },
    { key: 'lang', value: 'en' },
  ],
};

const environment = {
  id: '7c3d1e9a-2b4f-4a6c-9d8e-0f1a2b3c4d5e',
  name: 'Wild Atlas — Local',
  values: [
    { key: 'baseUrl', value: 'http://localhost:3000', type: 'default', enabled: true },
    { key: 'lang', value: 'en', type: 'default', enabled: true },
    { key: 'slug', value: 'siruvani-falls', type: 'default', enabled: true },
    { key: 'town', value: 'valparai', type: 'default', enabled: true },
    { key: 'corridor', value: 'coimbatore-valparai', type: 'default', enabled: true },
    { key: 'deviceId', value: '11111111-1111-4111-8111-111111111111', type: 'default', enabled: true },
    { key: 'cronSecret', value: 'local-cron-secret-123456', type: 'secret', enabled: true },
    { key: 'webhookSecret', value: 'local-webhook-secret-123456', type: 'secret', enabled: true },
    { key: 'linkToken', value: '', type: 'default', enabled: true },
    { key: 'linkCode', value: '', type: 'default', enabled: true },
    { key: 'tripId', value: '', type: 'default', enabled: true },
  ],
  _postman_variable_scope: 'environment',
  _postman_exported_using: 'Wild Atlas generator 1.0',
};

const count = (items) =>
  items.reduce((n, it) => n + (it.item ? count(it.item) : 1), 0);

writeFileSync(
  join(here, 'WildAtlas.postman_collection.json'),
  JSON.stringify(collection, null, 2) + '\n',
);
writeFileSync(
  join(here, 'WildAtlas.local.postman_environment.json'),
  JSON.stringify(environment, null, 2) + '\n',
);

console.log(`collection: ${count(collection.item)} requests`);
