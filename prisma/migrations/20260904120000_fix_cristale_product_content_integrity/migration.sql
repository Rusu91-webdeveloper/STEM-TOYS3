UPDATE "Product"
SET
  "description" = 'Set educativ 4M pentru creșterea unui cristal roșu acasă. Kitul include materialul pentru cristalizare, recipientul de creștere, baza de expunere și instrucțiunile experimentului. Procesul de cristalizare poate fi urmărit pe parcursul mai multor zile. Vârsta recomandată de producător este 10+. Respectă pașii și indicațiile de siguranță din instrucțiunile incluse în cutie.',
  "attributes" = jsonb_set(
    jsonb_set(
      COALESCE("attributes", '{}'::jsonb),
      '{brand}',
      '"4M"'::jsonb,
      true
    ),
    '{originalAgeText}',
    '"10+"'::jsonb,
    true
  ),
  "metadata" = jsonb_set(
    jsonb_set(
      COALESCE("metadata", '{}'::jsonb),
      '{metaDescription}',
      '"Set Cristale Roșu 4M pentru creșterea unui cristal acasă. Vârsta recomandată de producător: 10+."'::jsonb,
      true
    ),
    '{metaDescriptionRo}',
    '"Set Cristale Roșu 4M pentru creșterea unui cristal acasă. Vârsta recomandată de producător: 10+."'::jsonb,
    true
  ),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'set-cristale-rosu-4m-experiment-stem-viral-4M-03929';
