-- New events default to showing the banner on listing cards.
ALTER TABLE "events" ALTER COLUMN "showImageInList" SET DEFAULT true;
