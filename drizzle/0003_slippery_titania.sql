ALTER TABLE "payments" ADD COLUMN "userid" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "enrollmentid" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "title" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "amount" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "interestamount" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "penaltyamount" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "totalamount" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "duedate" date NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "paymentdate" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "paymentmethod" "payment_method";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "status" "payment_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "createdat" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "updatedat" timestamp DEFAULT now() NOT NULL;