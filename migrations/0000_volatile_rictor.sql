CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"project_id" integer,
	"user_id" integer NOT NULL,
	"reference_id" integer,
	"reference_type" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"path" text NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"is_latest_version" boolean DEFAULT true NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	"parent_file_id" integer,
	"version_note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"project_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"description" text,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_by_id" integer NOT NULL,
	"stripe_payment_intent_id" text,
	"message_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"budget" text,
	"target_date" text,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"first_name" text,
	"last_name" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"provider" text,
	"provider_id" text,
	"remember_token" text,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
