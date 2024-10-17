CREATE TABLE IF NOT EXISTS "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_name" varchar NOT NULL,
	"url" varchar NOT NULL
);
