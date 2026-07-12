import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Projects (e2e)', () => {
  let app: INestApplication;
  let ownerToken: string;
  let memberToken: string;
  let projectId: number;
  const suffix = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    const ownerEmail = `owner-${suffix}@example.com`;
    const memberEmail = `member-${suffix}@example.com`;

    await request(app.getHttpServer())
    .post('/users/register')
    .send({
        email: ownerEmail,
        username: 'owner',
        password: 'password123',
    })
    .expect(201);

    await request(app.getHttpServer())
      .post('/users/register')
      .send({
        email: memberEmail,
        username: 'member',
        password: 'password123',
      })
      .expect(201);

    const ownerLogin = await request(app.getHttpServer())
      .post('/users/login')
      .send({
        email: ownerEmail,
        password: 'password123',
      })
      .expect(201);

    ownerToken = ownerLogin.body.token;

    const memberLogin = await request(app.getHttpServer())
      .post('/users/login')
      .send({
        email: memberEmail,
        password: 'password123',
      })
      .expect(201);

    memberToken = memberLogin.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a project for the authenticated owner', async () => {
    const projectName = `Project-${suffix}`;

    const response = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        project_name: projectName,
        description: 'A sample project',
        deadline: '2026-12-31',
      })
      .expect(201);

    expect(response.body.project_name).toBe(projectName);
    expect(response.body.owner_user_id).toBeDefined();
    projectId = response.body.project_id;
  });

  it('lists projects the authenticated user can access', async () => {
    const response = await request(app.getHttpServer())
      .get('/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.some((item: any) => item.project_id === projectId)).toBe(true);
  });

  it('gets a single project by id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.project_id).toBe(projectId);
    expect(response.body.project_name).toBeDefined();
  });

  it('updates a project owned by the authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        description: 'Updated description',
      })
      .expect(200);

    expect(response.body.description).toBe('Updated description');
  });

  it('adds a member to the project and lists members', async () => {
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: `member-${suffix}@example.com` })
      .expect(201);

    const membersResponse = await request(app.getHttpServer())
      .get(`/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(Array.isArray(membersResponse.body)).toBe(true);
    expect(
      membersResponse.body.some((member: any) => member.email === `member-${suffix}@example.com`)
    ).toBe(true);
  });

  it('deletes a project owned by the authenticated user', async () => {
    await request(app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
  });
});