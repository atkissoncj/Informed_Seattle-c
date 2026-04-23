import csv
from django.db import connection

sql = """
SELECT
    d.id AS document_id,
    d.url,
    d.kind,
    d.title,
    d.mime_type,
    length(d.extracted_text) AS extracted_text_chars,

    base.style AS baseline_style,
    base.model AS baseline_model,
    base.created_at AS baseline_created_at,
    base.headline AS baseline_headline,
    base.body AS baseline_body,

    gem.style AS gemma_style,
    gem.model AS gemma_model,
    gem.created_at AS gemma_created_at,
    gem.headline AS gemma_headline,
    gem.body AS gemma_body

FROM documents_document d
LEFT JOIN documents_documentsummary base
    ON base.document_id = d.id
   AND base.style = 'what_changed'
LEFT JOIN documents_documentsummary gem
    ON gem.document_id = d.id
   AND gem.style = 'what_changed_gemma4'
ORDER BY d.id
"""

with connection.cursor() as cursor:
    cursor.execute(sql)
    headers = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

out_path = "gemma_eval_documents2.csv"
with open(out_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    writer.writerows(rows)

print(f"Wrote {len(rows)} rows to {out_path}")