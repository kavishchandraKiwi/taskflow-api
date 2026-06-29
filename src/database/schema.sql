CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    user_name VARCHAR NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    time_created TIMESTAMP DEFAULT NOW()
);
