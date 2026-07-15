import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Projects full E2E (projects.e2e-full)', () => {
  let app: INestApplication;
  const suffix = Date.now();

  const ownerEmail = `owner-${suffix}@test.com`;
  const memberEmail = `member-${suffix}@test.com`;
  const outsiderEmail = `outsider-${suffix}@test.com`;
  let ownerToken: string;
  let memberToken: string;
  let outsiderToken: string;
  let ownerId: number;
  let memberId: number;
  let projectId: number;

  async function createUser(email: string, username: string, password = 'Password123!') {
    return request(app.getHttpServer())
      .post('/users')
      .send({ email, username, password });
  }

  async function loginUser(email: string, password = 'Password123!') {
    return request(app.getHttpServer()).post('/users/login').send({ email, password });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create users
    const r1 = await createUser(ownerEmail, 'owner').expect(201);
    ownerId = r1.body.user_id ?? r1.body.id ?? undefined;

    const r2 = await createUser(memberEmail, 'member').expect(201);
    memberId = r2.body.user_id ?? r2.body.id ?? undefined;

    await createUser(outsiderEmail, 'outsider').expect(201);

    // Login all three
    const lo = await loginUser(ownerEmail).expect(201);
    ownerToken = lo.body.token;

    const lm = await loginUser(memberEmail).expect(201);
    memberToken = lm.body.token;

    const lo2 = await loginUser(outsiderEmail).expect(201);
    outsiderToken = lo2.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  // AUTH
  it('1. Unauthorized request -> GET /projects returns 401', async () => {
    await request(app.getHttpServer()).get('/projects').expect(401);
  });

  // CREATE PROJECT
  it('2. Create project (happy path) -> POST /projects returns 201 and body contains project_id, project_name, owner_user_id', async () => {
    const res = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        project_name: 'Backend API',
        description: 'Nest Project',
        deadline: '2026-12-31',
      })
      .expect(201);

    expect(res.body.project_id).toBeDefined();
    expect(res.body.project_name).toBe('Backend API');
    expect(res.body.owner_user_id).toBeDefined();
    projectId = res.body.project_id;
  });

  it('3. Duplicate project name -> POST same project returns 409', async () => {
    await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        project_name: 'Backend API',
        description: 'Nest Project',
        deadline: '2026-12-31',
      })
      .expect(409);
  });

  it('4. Validation error -> POST /projects with empty body returns 400', async () => {
    await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({})
      .expect(400);
  });

  // LIST PROJECTS
  it('5. Owner sees project in GET /projects', async () => {
    const res = await request(app.getHttpServer())
      .get('/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((p: any) => p.project_name === 'Backend API' && p.project_id === projectId)).toBe(true);
  });

  it('6. Outsider should not see project -> GET /projects returns [] for outsider', async () => {
    const res = await request(app.getHttpServer())
      .get('/projects')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    // expects no projects visible
    expect(res.body.every((p: any) => p.project_id !== projectId)).toBe(true);
  });

  // GET PROJECT
  it('7. Owner fetches project -> GET /projects/:id returns 200', async () => {
    const res = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(res.body.project_id).toBe(projectId);
  });

  it('8. Outsider fetches project -> GET /projects/:id returns 404', async () => {
    await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(404);
  });

  it('9. Invalid ID -> GET /projects/abc returns 400', async () => {
    await request(app.getHttpServer())
      .get('/projects/abc')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(400);
  });

  // UPDATE PROJECT
  it('10. Owner updates project -> PATCH /projects/:id returns 200 and name changed', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ project_name: 'Updated' })
      .expect(200);

    expect(res.body.project_name).toBe('Updated');
  });

  it('11. Non-owner update -> member tries to PATCH and gets 403', async () => {
    // first add member
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: memberEmail })
      .expect((res) => {
        if (![200, 201].includes(res.status)) throw new Error(`expected 200 or 201, got ${res.status}`);
      });

    await request(app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ project_name: 'MemberUpdate' })
      .expect(403);
  });

  it('12. Invalid id -> PATCH /projects/abc returns 400', async () => {
    await request(app.getHttpServer())
      .patch('/projects/abc')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ project_name: 'x' })
      .expect(400);
  });

  it('13. Empty body -> PATCH /projects/:id with {} returns 200 and existing project returned', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({})
      .expect(200);

    expect(res.body.project_id).toBe(projectId);
  });

  // ADD MEMBER
  it('14. Owner adds member -> POST /projects/:id/members returns 201/200 and message', async () => {
    const res = await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: memberEmail })
      .expect((r) => {
        if (![200, 201].includes(r.status)) throw new Error(`expected 200 or 201, got ${r.status}`);
      });

    // Optionally check message if present
    if (res.body.message) expect(typeof res.body.message).toBe('string');
  });

  it('15. Add same member twice -> returns 409', async () => {
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: memberEmail })
      .expect(409);
  });

  it('16. Non-owner adds member -> member tries to add -> 403', async () => {
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ email: outsiderEmail })
      .expect(403);
  });

  it('17. Add nonexistent user -> returns 404', async () => {
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'ghost-nope@test.invalid' })
      .expect(404);
  });

  it('18. Invalid project id -> POST /projects/abc/members returns 400', async () => {
    await request(app.getHttpServer())
      .post('/projects/abc/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: memberEmail })
      .expect(400);
  });

  // LIST MEMBERS
  it('19. Owner lists members -> GET /projects/:id/members returns 200 and contains owner+member', async () => {
    const res = await request(app.getHttpServer())
      .get(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const emails = res.body.map((m: any) => m.email);
    expect(emails).toEqual(expect.arrayContaining([ownerEmail, memberEmail]));
  });

  it('20. Member lists members -> GET /projects/:id/members returns 200', async () => {
    const res = await request(app.getHttpServer())
      .get(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('21. Outsider lists members -> GET /projects/:id/members returns 403', async () => {
    await request(app.getHttpServer())
      .get(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });

  it('22. Nonexistent project members -> GET /projects/99999/members returns 404', async () => {
    await request(app.getHttpServer())
      .get('/projects/99999/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });

  // DELETE PROJECT
  it('23. Non-owner delete -> member tries DELETE and gets 403', async () => {
    await request(app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('24. Owner delete -> DELETE /projects/:id returns 200 and message', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    if (res.body.message) expect(typeof res.body.message).toBe('string');
  });

  it('25. Delete again -> DELETE /projects/:id returns 404', async () => {
    await request(app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });
});