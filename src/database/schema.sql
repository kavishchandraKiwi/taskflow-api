
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    user_name VARCHAR NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    time_created TIMESTAMP DEFAULT NOW()
);
CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    time_created TIMESTAMP DEFAULT NOW(),
    owner_user_id INT REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE projects_members(
    project_id INT REFERENCES projects(project_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
);