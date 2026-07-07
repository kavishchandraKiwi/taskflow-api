
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    time_created TIMESTAMP DEFAULT NOW()
);
CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    deadline TIMESTAMP,
    owner_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (project_name, owner_user_id)
);
CREATE TABLE projects_members(
    project_id INT REFERENCES projects(project_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
);
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(10) NOT NULL CHECK(priority IN ('low','medium','high')),

    status VARCHAR(20) NOT NULL CHECK(status IN ('todo','in_progress','done')),
    due_date TIMESTAMP,
    project_id INT NOT NULL,
    assigned_by_user_id INT NOT NULL,
    assigned_to_user_id INT,

    FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY(assigned_by_user_id) REFERENCES users(user_id),
    FOREIGN KEY(project_id, assigned_to_user_id) REFERENCES projects_members(project_id, user_id)
);