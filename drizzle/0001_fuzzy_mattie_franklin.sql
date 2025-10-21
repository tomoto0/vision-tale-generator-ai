CREATE TABLE `stories` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`imageUrl` text NOT NULL,
	`imageDescription` text,
	`story` text NOT NULL,
	`title` varchar(255),
	`genre` varchar(100),
	`mood` varchar(100),
	`characters` text,
	`setting` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `stories_id` PRIMARY KEY(`id`)
);
