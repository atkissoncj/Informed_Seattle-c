from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("legistar", "0002_crawlmetadata"),
    ]

    operations = [
        migrations.AddField(
            model_name="legislation",
            name="vote_data",
            field=models.JSONField(
                default=dict,
                help_text="Persisted council vote breakdown: {action_details: [{action_by, action}]}",
            ),
        ),
    ]
