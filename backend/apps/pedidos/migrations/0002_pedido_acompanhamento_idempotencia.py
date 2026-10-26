import uuid
from django.db import migrations, models

def preencher(apps, schema_editor):
    Pedido = apps.get_model('pedidos', 'Pedido')
    for pedido in Pedido.objects.using(schema_editor.connection.alias).filter(acompanhamento__isnull=True).iterator():
        pedido.acompanhamento = uuid.uuid4()
        pedido.save(update_fields=['acompanhamento'])

class Migration(migrations.Migration):
    dependencies = [('pedidos', '0001_initial')]
    operations = [
        migrations.AddField(model_name='pedido', name='acompanhamento', field=models.UUIDField(null=True, editable=False, unique=True)),
        migrations.RunPython(preencher, migrations.RunPython.noop),
        migrations.AlterField(model_name='pedido', name='acompanhamento', field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
        migrations.AddField(model_name='pedido', name='chave_idempotencia', field=models.UUIDField(null=True, blank=True, unique=True)),
    ]
