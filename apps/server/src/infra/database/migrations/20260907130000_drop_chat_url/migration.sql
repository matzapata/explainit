-- Fold Website url into hostOrigins (as origin), then drop url.
UPDATE "Chat"
SET "hostOrigins" = (
  SELECT ARRAY(
    SELECT DISTINCT origin
    FROM (
      SELECT unnest(COALESCE("hostOrigins", ARRAY[]::TEXT[])) AS origin
      UNION ALL
      SELECT CASE
        WHEN "url" IS NULL OR btrim("url") = '' THEN NULL
        ELSE regexp_replace(btrim("url"), '(^[a-zA-Z][a-zA-Z0-9+.-]*://[^/?#]+).*$', '\1')
      END
    ) AS origins
    WHERE origin IS NOT NULL AND origin <> ''
  )
);

ALTER TABLE "Chat" DROP COLUMN "url";
