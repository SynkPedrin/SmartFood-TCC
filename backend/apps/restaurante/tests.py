import uuid
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APITestCase
from apps.categorias.models import Categoria
from apps.produtos.models import Produto
from apps.mesas.models import Mesa
from apps.pedidos.models import Pedido, ItemPedido
from .models import Memoria, Configuracao

class EntregaTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = get_user_model().objects.create_user(username='gestor',password='Test-only-Strong1',is_staff=True)
        self.equipe = get_user_model().objects.create_user(username='cozinha',password='Test-only-Strong1')
        self.cat = Categoria.objects.create(nome='Pratos')
        self.prod = Produto.objects.create(nome='Prato',preco=Decimal('10.00'),categoria=self.cat)
        self.mesa = Mesa.objects.create(numero=1)

    def dados(self, **kwargs):
        return {'mesa':self.mesa.pk, 'itens':[{'produto':self.prod.pk,'quantidade':2}],**kwargs}

    def test_status_inicial_nao_pode_ser_falsificado(self):
        for estado in ('entregue','pronto','cancelado','preparando'):
            r=self.client.post('/api/v1/pedidos/',self.dados(status=estado),format='json')
            self.assertEqual(r.status_code,400)
        self.assertFalse(Pedido.objects.exists())
        self.mesa.refresh_from_db(); self.assertEqual(self.mesa.status,'disponivel')

    def test_quantidade_excessiva_e_rejeitada(self):
        r=self.client.post('/api/v1/pedidos/',self.dados(itens=[{'produto':self.prod.pk,'quantidade':100}]),format='json')
        self.assertEqual(r.status_code,400)
        self.assertFalse(Pedido.objects.exists())

    def test_pedido_repetido_nao_duplica(self):
        dados=self.dados(chave_idempotencia=str(uuid.uuid4()))
        primeiro=self.client.post('/api/v1/pedidos/',dados,format='json')
        segundo=self.client.post('/api/v1/pedidos/',dados,format='json')
        self.assertEqual(primeiro.status_code,201); self.assertEqual(segundo.status_code,200)
        self.assertEqual(primeiro.data['id'],segundo.data['id'])
        self.assertEqual(Pedido.objects.count(),1)
        self.assertNotIn('itens',segundo.data)

    def test_chave_invalida_rejeitada(self):
        self.assertEqual(self.client.post('/api/v1/pedidos/',self.dados(chave_idempotencia='x'),format='json').status_code,400)

    def test_mesa_reservada_nao_recebe_pedido(self):
        self.mesa.status='reservada'; self.mesa.save()
        self.assertEqual(self.client.post('/api/v1/pedidos/',self.dados(),format='json').status_code,400)

    def test_mesa_manutencao_nao_recebe_pedido(self):
        self.mesa.status='manutencao'; self.mesa.save()
        self.assertEqual(self.client.post('/api/v1/pedidos/',self.dados(),format='json').status_code,400)

    def test_mesa_ocupada_pode_receber_complemento(self):
        self.mesa.status='ocupada'; self.mesa.save()
        self.assertEqual(self.client.post('/api/v1/pedidos/',self.dados(),format='json').status_code,201)

    def test_acompanhamento_publico_sem_dados_internos(self):
        r=self.client.post('/api/v1/pedidos/',self.dados(),format='json')
        result=self.client.get(f"/api/v1/acompanhamento/{r.data['acompanhamento']}/")
        self.assertEqual(result.status_code,200)
        self.assertEqual(set(result.data),{'id','status','status_display','tempo_preparo_estimado'})
        self.assertEqual(self.client.get(f'/api/v1/acompanhamento/{uuid.uuid4()}/').status_code,404)

    def test_mesa_do_pedido_nao_muda(self):
        pedido=Pedido.objects.create(mesa=self.mesa)
        outra=Mesa.objects.create(numero=2)
        self.client.force_authenticate(self.equipe)
        self.assertEqual(self.client.patch(f'/api/v1/pedidos/{pedido.pk}/',{'mesa':outra.pk},format='json').status_code,400)

    def test_itens_nao_podem_ser_editados_silenciosamente(self):
        pedido=Pedido.objects.create(mesa=self.mesa)
        self.client.force_authenticate(self.equipe)
        self.assertEqual(self.client.patch(f'/api/v1/pedidos/{pedido.pk}/',{'itens':[{'produto':self.prod.pk,'quantidade':2}]},format='json').status_code,400)

    def test_historico_nao_pode_ser_apagado(self):
        pedido=Pedido.objects.create(mesa=self.mesa)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(f'/api/v1/pedidos/{pedido.pk}/').status_code,400)
        self.assertTrue(Pedido.objects.filter(pk=pedido.pk).exists())

    def test_ia_admin_exige_login(self):
        self.assertEqual(self.client.post('/api/v1/ia/acesso/',{'mode':'admin'},format='json').status_code,401)
        self.assertEqual(self.client.post('/api/v1/ia/acesso/',{'mode':'totem'},format='json').status_code,200)

    def test_ia_admin_e_memorias_sao_exclusivos_do_administrador(self):
        self.client.force_authenticate(self.equipe)
        self.assertEqual(self.client.post('/api/v1/ia/acesso/',{'mode':'admin'},format='json').status_code,403)
        self.assertEqual(self.client.get('/api/v1/ia/memorias/').status_code,403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post('/api/v1/ia/acesso/',{'mode':'admin'},format='json').status_code,200)

    def test_excluir_com_historico_responde_409(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(f'/api/v1/categorias/{self.cat.pk}/').status_code,409)
        self.assertTrue(Categoria.objects.filter(pk=self.cat.pk).exists())

    def test_produto_de_categoria_inativa_nao_entra_no_pedido(self):
        self.cat.ativo=False; self.cat.save()
        self.assertEqual(self.client.post('/api/v1/pedidos/',self.dados(),format='json').status_code,400)
        self.assertFalse(Pedido.objects.exists())

    def test_mesas_filtram_por_status(self):
        Mesa.objects.create(numero=2,status='manutencao')
        r=self.client.get('/api/v1/mesas/?status=manutencao')
        self.assertEqual([m['numero'] for m in r.data['results']],[2])

    def test_ia_recusa_outra_conta(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post('/api/v1/ia/acesso/',{'mode':'admin','conta':'sushi-yama'},format='json').status_code,403)

    def test_memoria_exige_login_e_papel_de_admin(self):
        self.assertEqual(self.client.post('/api/v1/ia/memorias/',{'texto':'a'},format='json').status_code,401)
        self.client.force_authenticate(self.equipe)
        self.assertEqual(self.client.post('/api/v1/ia/memorias/',{'texto':'a'},format='json').status_code,403)
        self.assertFalse(Memoria.objects.exists())

    def test_memoria_persiste_e_autor_nao_e_falsificado(self):
        self.client.force_authenticate(self.admin)
        r=self.client.post('/api/v1/ia/memorias/',{'texto':'A casa fecha às 22h.','autor':'outro'},format='json')
        self.assertEqual(r.status_code,201)
        memoria=Memoria.objects.get(); self.assertEqual(memoria.autor,self.admin)
        self.assertEqual(self.client.get('/api/v1/ia/memorias/').data['results'][0]['texto'],'A casa fecha às 22h.')

    def test_memoria_longa_e_rejeitada(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post('/api/v1/ia/memorias/',{'texto':'x'*2001},format='json').status_code,400)

    def test_memoria_nao_pode_ser_gravada_em_outra_conta(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post('/api/v1/ia/memorias/',{'texto':'a','conta':'sushi-yama'},format='json').status_code,403)

    def test_marca_e_publica_e_escrita_exige_admin(self):
        self.assertEqual(self.client.get('/api/v1/restaurante/').status_code,200)
        self.assertEqual(self.client.patch('/api/v1/restaurante/',{'name':'Casa'},format='json').status_code,401)
        self.client.force_authenticate(self.equipe)
        self.assertEqual(self.client.patch('/api/v1/restaurante/',{'name':'Casa'},format='json').status_code,403)

    def test_marca_persistida_pode_ser_lida_sem_login(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.patch('/api/v1/restaurante/',{'name':'Casa','accent':'#334455'},format='json').status_code,200)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get('/api/v1/restaurante/').data['name'],'Casa')
        self.assertEqual(Configuracao.objects.count(),1)

    def test_marca_rejeita_svg_ativo_e_cor_invalida(self):
        self.client.force_authenticate(self.admin)
        for dado in ({'accent':'red'},{'logo':'data:image/svg+xml;base64,AAA'},{'background':'script'}):
            self.assertEqual(self.client.patch('/api/v1/restaurante/',dado,format='json').status_code,400)

    def test_indicadores_exigem_login(self):
        self.assertEqual(self.client.get('/api/v1/indicadores/').status_code,401)

    def test_indicadores_nao_limitam_a_primeira_pagina(self):
        for _ in range(25):
            pedido=Pedido.objects.create(mesa=self.mesa,status='entregue')
            ItemPedido.objects.create(pedido=pedido,produto=self.prod,quantidade=2,preco_unitario=Decimal('10.00'))
        cancelado=Pedido.objects.create(mesa=self.mesa,status='cancelado')
        ItemPedido.objects.create(pedido=cancelado,produto=self.prod,quantidade=99,preco_unitario=Decimal('10.00'))
        self.client.force_authenticate(self.equipe)
        result=self.client.get('/api/v1/indicadores/').data
        self.assertEqual(Decimal(result['receita']),Decimal('500.00'))
        self.assertEqual(Decimal(result['ticket_medio']),Decimal('20.00'))
        self.assertEqual(result['pedidos_hoje'],26); self.assertEqual(result['entregues'],25)
        self.assertEqual(result['mais_vendidos'][0]['quantidade'],50)

    def test_ia_publica_tem_limite_de_requisicoes(self):
        for _ in range(20): self.assertEqual(self.client.post('/api/v1/ia/acesso/',{'mode':'totem'},format='json').status_code,200)
        self.assertEqual(self.client.post('/api/v1/ia/acesso/',{'mode':'totem'},format='json').status_code,429)

    def test_health_consulta_banco(self):
        self.assertEqual(self.client.get('/api/v1/health/').data,{'status':'ok'})

    def test_token_expirado_nao_autentica(self):
        from datetime import timedelta
        from rest_framework.authtoken.models import Token
        token=Token.objects.create(user=self.equipe)
        Token.objects.filter(pk=token.pk).update(created=timezone.now()-timedelta(hours=25))
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        self.assertEqual(self.client.get('/api/v1/auth/eu/').status_code,401)

    def test_ticket_websocket_exige_login(self):
        self.assertEqual(self.client.post('/api/v1/auth/ws-ticket/').status_code,401)
        self.client.force_authenticate(self.equipe)
        r=self.client.post('/api/v1/auth/ws-ticket/')
        self.assertEqual(r.status_code,200); self.assertEqual(r.data['expires_in'],30)
        self.assertNotIn('token',r.data)

    def test_ticket_websocket_so_pode_ser_usado_uma_vez(self):
        from asgiref.sync import async_to_sync
        from apps.pedidos.consumers import _usuario_do_ticket
        from .models import WebsocketTicket
        from datetime import timedelta
        ticket=WebsocketTicket.objects.create(usuario=self.equipe,expira_em=timezone.now()+timedelta(seconds=30))
        self.assertEqual(async_to_sync(_usuario_do_ticket)(str(ticket.pk)).pk,self.equipe.pk)
        self.assertIsNone(async_to_sync(_usuario_do_ticket)(str(ticket.pk)))


class CardapioOficialTests(APITestCase):
    def test_seed_menu_so_cadastra_itens_com_foto_e_retira_os_demais(self):
        from io import StringIO
        from django.core.management import call_command
        from apps.produtos.management.commands.seed_menu import PRODUTOS
        pizzas = Categoria.objects.create(nome='Pizzas')
        vendida = Produto.objects.create(nome='Feijoada', slug='feijoada', preco=Decimal('44.90'), categoria=pizzas)
        Produto.objects.create(nome='Pudim', slug='pudim', preco=Decimal('14.90'), categoria=pizzas)
        mesa = Mesa.objects.create(numero=1)
        pedido = Pedido.objects.create(mesa=mesa)
        ItemPedido.objects.create(pedido=pedido, produto=vendida, quantidade=1, preco_unitario=Decimal('44.90'))
        call_command('seed_menu', stdout=StringIO())
        self.assertTrue(all(foto for *_, foto in PRODUTOS))
        self.assertFalse(Produto.objects.filter(slug='pudim').exists())
        vendida.refresh_from_db(); pizzas.refresh_from_db()
        self.assertFalse(vendida.disponivel)
        self.assertFalse(pizzas.ativo)
        self.assertEqual(Produto.objects.filter(disponivel=True).exclude(imagem='').count(), len(PRODUTOS))
