-- Supabase Migration: Seeding Demo Menu Content for Ghanaian Restaurant Client Demo
-- This script truncates existing menu items to prevent duplication and inserts premium menu items.
-- Running this inside Supabase SQL Editor instantly populates the restaurant's menu with professional items.

-- 1. Clean the menu items table to start fresh
DELETE FROM public.menu_items;

-- 2. Insert premium demo menu items
INSERT INTO public.menu_items (
  id,
  name,
  description,
  image_url,
  price,
  category,
  dietary_tags,
  available,
  limited_stock,
  remaining,
  is_combo,
  combo_items,
  customizations,
  sort_order
) VALUES
  (
    'a3c7d6b8-2a94-4d83-9b2f-8705c9a41234',
    'Premium Jollof Rice',
    'Spicy, savory Ghanaian Jollof rice cooked in a rich tomato and pepper base. Served with a seasoned grilled chicken quarter, fresh coleslaw, and sweet fried plantains.',
    'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=600&auto=format&fit=crop&q=80',
    35.00,
    'Rice Dishes',
    ARRAY['spicy', 'halal'],
    true,
    NULL,
    999,
    false,
    '[]'::jsonb,
    '[
      {
        "name": "Spice Level",
        "options": [
          {"label": "Mild", "price_adj": 0},
          {"label": "Medium", "price_adj": 0},
          {"label": "Extra Spicy", "price_adj": 0}
        ]
      },
      {
        "name": "Add-ons",
        "options": [
          {"label": "Extra Chicken Quarter", "price_adj": 12.00},
          {"label": "Side Salad", "price_adj": 3.00},
          {"label": "Boiled Egg", "price_adj": 3.00}
        ]
      }
    ]'::jsonb,
    1
  ),
  (
    'b7d8e9c0-3b05-4e94-ac3f-9816d0b52345',
    'Navrongo Special Fried Rice',
    'Wok-tossed fragrant jasmine rice with green peas, carrots, sweet corn, eggs, and seasoned shredded chicken. Served with a side of house-made hot shito pepper sauce.',
    'https://images.unsplash.com/photo-1603133872878-685f548e7a1a?w=600&auto=format&fit=crop&q=80',
    35.00,
    'Rice Dishes',
    ARRAY['spicy'],
    true,
    NULL,
    999,
    false,
    '[]'::jsonb,
    '[
      {
        "name": "Spice Level",
        "options": [
          {"label": "Mild", "price_adj": 0},
          {"label": "Medium", "price_adj": 0},
          {"label": "Extra Spicy (with Shito)", "price_adj": 0}
        ]
      },
      {
        "name": "Add-ons",
        "options": [
          {"label": "Extra Chicken Quarter", "price_adj": 12.00},
          {"label": "Fried Egg on Top", "price_adj": 3.00},
          {"label": "Sausage slices", "price_adj": 5.00}
        ]
      }
    ]'::jsonb,
    2
  ),
  (
    'c8e9f0a1-4c16-4f05-bd4f-0927e1c63456',
    'Traditional Fufu & Goat Light Soup',
    'Soft, smooth pounded plantain and cassava fufu served in a rich, deeply steaming bowl of traditional goat meat light soup, seasoned with local organic spices.',
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80',
    30.00,
    'Local Dishes',
    ARRAY['spicy'],
    true,
    NULL,
    999,
    false,
    '[]'::jsonb,
    '[
      {
        "name": "Meat Options",
        "options": [
          {"label": "Goat Meat Only", "price_adj": 0},
          {"label": "Assorted (Goat, Beef, Tripe)", "price_adj": 5.00},
          {"label": "Double Goat Meat Portion", "price_adj": 10.00}
        ]
      }
    ]'::jsonb,
    3
  ),
  (
    'd9f0a1b2-5d27-4f16-ce5f-1038f2d74567',
    'Grilled Tilapia & Banku',
    'Perfectly seasoned large Tilapia charcoal-grilled to juicy perfection. Served with two balls of fermented corn and cassava dough banku, freshly ground green/red pepper paste, sliced onions, tomatoes, and shito.',
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
    40.00,
    'Local Dishes',
    ARRAY['spicy', 'halal'],
    true,
    NULL,
    999,
    false,
    '[]'::jsonb,
    '[
      {
        "name": "Pepper Choice",
        "options": [
          {"label": "Green Chili Pepper Sauce", "price_adj": 0},
          {"label": "Red Chili Pepper Sauce", "price_adj": 0},
          {"label": "Both Pepper Sauces", "price_adj": 0}
        ]
      },
      {
        "name": "Add-ons",
        "options": [
          {"label": "Extra Banku Ball", "price_adj": 4.00},
          {"label": "Fried Plantain Portion", "price_adj": 8.00}
        ]
      }
    ]'::jsonb,
    4
  ),
  (
    'e0a1b2c3-6e38-4f27-df6f-2149f3e85678',
    'Spicy Beef & Chicken Pizza',
    'House-crafted fresh dough crust, tomato marinara base, spiced minced beef, diced roasted chicken breast, bell peppers, purple onions, green chilies, topped with an absolute abundance of melted mozzarella cheese.',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    65.00,
    'Pizza',
    ARRAY['spicy'],
    true,
    NULL,
    999,
    false,
    '[]'::jsonb,
    '[
      {
        "name": "Pizza Size",
        "options": [
          {"label": "Medium Crust", "price_adj": 0},
          {"label": "Large Premium Crust", "price_adj": 20.00}
        ]
      },
      {
        "name": "Extra Toppings",
        "options": [
          {"label": "Double Mozzarella Cheese", "price_adj": 8.00},
          {"label": "Extra Beef & Chicken", "price_adj": 12.00}
        ]
      }
    ]'::jsonb,
    5
  ),
  (
    'f1b2c3d4-7f49-4f38-e07f-3250f4f96789',
    'Spiced Fried Plantain (Kelewele)',
    'Soft ripe plantain cubes seasoned with ground ginger, cayenne pepper, onions, and deep-fried to caramelized golden-brown perfection. A local favorite street snack!',
    'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop&q=80',
    12.00,
    'Sides',
    ARRAY['vegetarian', 'vegan', 'gluten-free', 'spicy'],
    true,
    NULL,
    999,
    false,
    '[]'::jsonb,
    '[]'::jsonb,
    6
  ),
  (
    '02c3d4e5-8a50-4f49-f18f-4361f5a07890',
    'Hibiscus Spiced Sobolo',
    'Refreshing traditional drink brewed from natural dried hibiscus sepals, infused with intense local ginger, cloves, pepper spikes, sweetened with fresh pineapple juice, served cold.',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    10.00,
    'Drinks',
    ARRAY['vegetarian', 'vegan', 'gluten-free'],
    true,
    NULL,
    999,
    false,
    '[]'::jsonb,
    '[
      {
        "name": "Serving Style",
        "options": [
          {"label": "Chilled over Ice", "price_adj": 0},
          {"label": "Cold, No Ice", "price_adj": 0}
        ]
      }
    ]'::jsonb,
    7
  ),
  (
    '13d4e5f6-9b61-4f50-a29f-5472f6b18901',
    'Coca-Cola (Glass Bottle)',
    'Standard carbonated Coca-Cola soda served chilled in an authentic retro glass bottle for that pure, sweet premium thirst-quenching taste.',
    'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    8.00,
    'Drinks',
    ARRAY['vegetarian', 'vegan', 'gluten-free'],
    true,
    NULL,
    999,
    false,
    '[]'::jsonb,
    '[]'::jsonb,
    8
  );
