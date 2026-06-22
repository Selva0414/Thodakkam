-- Community Features
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    author_id TEXT,
    author_name VARCHAR(255),
    author_role VARCHAR(255),
    author_avatar VARCHAR(255),
    content TEXT NOT NULL,
    tags TEXT[],
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Refers to student id or other user types
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL,
    author_name VARCHAR(255),
    author_avatar VARCHAR(255),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MCQ / Learning Features
CREATE TABLE IF NOT EXISTS mcq_questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    correct_option_index INTEGER NOT NULL,
    category VARCHAR(100),
    difficulty VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mcq_results (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    category VARCHAR(100),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
