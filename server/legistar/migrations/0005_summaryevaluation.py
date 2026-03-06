# Generated manually 2026-03-06

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('legistar', '0004_amendment_summary'),
    ]

    operations = [
        migrations.CreateModel(
            name='SummaryEvaluation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('scores', models.JSONField(default=dict, help_text='Per-dimension rubric scores: each key maps to {completeness: 1-5, faithfulness: 1-5, reasoning: str}.')),
                ('overall_completeness', models.FloatField(blank=True, help_text='Mean completeness score across all rubric dimensions (1-5).', null=True)),
                ('overall_faithfulness', models.FloatField(blank=True, help_text='Mean faithfulness score across all rubric dimensions (1-5).', null=True)),
                ('claude_model', models.CharField(blank=True, help_text='The Claude model ID used to generate this evaluation.', max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('legislation_summary', models.OneToOneField(help_text='The OLMo-generated legislation summary being evaluated.', on_delete=django.db.models.deletion.CASCADE, related_name='evaluation', to='legistar.legislationsummary')),
            ],
            options={
                'verbose_name': 'Summary evaluation',
                'verbose_name_plural': 'Summary evaluations',
            },
        ),
    ]
