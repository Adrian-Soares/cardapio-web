-- ============================================================
-- Dados de exemplo para testar o cardápio público.
-- ANTES de executar:
--   1. Crie um usuário em Authentication > Users (Add user)
--   2. Copie o UUID do usuário e cole abaixo no lugar de COLE-O-UUID-DO-USUARIO-AQUI
-- Depois acesse o cardápio em: http://localhost:5173/pizzaria-do-jadriano
-- ============================================================

do $$
declare
  v_user_id uuid := '4bf0f2b9-7ce3-4638-bf06-e5ada6d3798d';
  v_pizzaria_id uuid;
  v_cat_tradicionais uuid;
  v_cat_especiais uuid;
  v_cat_bebidas uuid;
  v_produto_id uuid;
begin
  insert into pizzarias (user_id, nome, slug, whatsapp)
  values (v_user_id, 'Pizzaria do Jadriano', 'pizzaria-do-jadriano', '5511999999999')
  returning id into v_pizzaria_id;

  insert into categorias (pizzaria_id, nome, ordem) values
    (v_pizzaria_id, 'Pizzas Tradicionais', 1) returning id into v_cat_tradicionais;
  insert into categorias (pizzaria_id, nome, ordem) values
    (v_pizzaria_id, 'Pizzas Especiais', 2) returning id into v_cat_especiais;
  insert into categorias (pizzaria_id, nome, ordem) values
    (v_pizzaria_id, 'Bebidas', 3) returning id into v_cat_bebidas;

  -- Tradicionais
  insert into produtos (pizzaria_id, categoria_id, nome, descricao)
  values (v_pizzaria_id, v_cat_tradicionais, 'Calabresa', 'Molho de tomate, calabresa fatiada, cebola e orégano')
  returning id into v_produto_id;
  insert into tamanhos_produto (produto_id, nome, preco) values
    (v_produto_id, 'Média', 39.90), (v_produto_id, 'Grande', 49.90);

  insert into produtos (pizzaria_id, categoria_id, nome, descricao)
  values (v_pizzaria_id, v_cat_tradicionais, 'Mussarela', 'Molho de tomate, mussarela, tomate e orégano')
  returning id into v_produto_id;
  insert into tamanhos_produto (produto_id, nome, preco) values
    (v_produto_id, 'Média', 37.90), (v_produto_id, 'Grande', 47.90);

  insert into produtos (pizzaria_id, categoria_id, nome, descricao)
  values (v_pizzaria_id, v_cat_tradicionais, 'Portuguesa', 'Presunto, ovo, cebola, ervilha, mussarela e orégano')
  returning id into v_produto_id;
  insert into tamanhos_produto (produto_id, nome, preco) values
    (v_produto_id, 'Média', 42.90), (v_produto_id, 'Grande', 52.90);

  -- Especiais
  insert into produtos (pizzaria_id, categoria_id, nome, descricao)
  values (v_pizzaria_id, v_cat_especiais, 'Quatro Queijos', 'Mussarela, provolone, parmesão e catupiry')
  returning id into v_produto_id;
  insert into tamanhos_produto (produto_id, nome, preco) values
    (v_produto_id, 'Média', 46.90), (v_produto_id, 'Grande', 56.90);

  insert into produtos (pizzaria_id, categoria_id, nome, descricao)
  values (v_pizzaria_id, v_cat_especiais, 'Frango com Catupiry', 'Frango desfiado, catupiry, milho e orégano')
  returning id into v_produto_id;
  insert into tamanhos_produto (produto_id, nome, preco) values
    (v_produto_id, 'Média', 44.90), (v_produto_id, 'Grande', 54.90);

  -- Bebidas
  insert into produtos (pizzaria_id, categoria_id, nome, descricao)
  values (v_pizzaria_id, v_cat_bebidas, 'Refrigerante', 'Coca-Cola, Guaraná ou Fanta')
  returning id into v_produto_id;
  insert into tamanhos_produto (produto_id, nome, preco) values
    (v_produto_id, 'Lata 350ml', 6.00), (v_produto_id, '2 Litros', 14.00);
end $$;
