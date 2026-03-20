import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Sawree database...');

  /*
  // ── Restaurants ────────────────────────────────────────────────────────────
  const restaurants = await Promise.all([
    prisma.restaurant.upsert({
      where: { id: 'rest-1' },
      update: { status: 'APPROVED' } as any,
      create: {
        id: 'rest-1',
        name: 'Spice Garden',
        description: 'Andheri West, Mumbai',
        imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop',
        cuisines: ['Indian', 'North Indian', 'Curry', 'Biryani'],
        rating: 4.5,
        totalRatings: 2340,
        deliveryTime: '30-40 min',
        deliveryFee: 29,
        minOrder: 199,
        isOpen: true,
        isPopular: true,
        latitude: 19.136,
        longitude: 72.826,
        status: 'APPROVED',
      } as any,
    }),
    prisma.restaurant.upsert({
      where: { id: 'rest-2' },
      update: { status: 'APPROVED' } as any,
      create: {
        id: 'rest-2',
        name: 'Pizza Paradise',
        description: 'Bandra, Mumbai',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
        cuisines: ['Pizza', 'Italian', 'Pasta', 'Fast Food'],
        rating: 4.3,
        totalRatings: 1820,
        deliveryTime: '25-35 min',
        deliveryFee: 39,
        minOrder: 299,
        isOpen: true,
        latitude: 19.054,
        longitude: 72.841,
        status: 'APPROVED',
      } as any,
    }),
    prisma.restaurant.upsert({
      where: { id: 'rest-3' },
      update: { status: 'APPROVED' } as any,
      create: {
        id: 'rest-3',
        name: 'Dragon Palace',
        description: 'Powai, Mumbai',
        imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=400&fit=crop',
        cuisines: ['Chinese', 'Noodles', 'Fried Rice', 'Manchurian'],
        rating: 4.1,
        totalRatings: 980,
        deliveryTime: '35-45 min',
        deliveryFee: 49,
        minOrder: 249,
        isOpen: true,
        latitude: 19.117,
        longitude: 72.906,
        status: 'APPROVED',
      } as any,
    }),
    prisma.restaurant.upsert({
      where: { id: 'rest-4' },
      update: { deliveryFee: 0, status: 'APPROVED' } as any,
      create: {
        id: 'rest-4',
        name: 'Burger Junction',
        description: 'Malad, Mumbai',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop',
        cuisines: ['Burger', 'American', 'Fast Food', 'Snacks'],
        rating: 4.4,
        totalRatings: 3100,
        deliveryTime: '20-30 min',
        deliveryFee: 0,
        minOrder: 149,
        isOpen: true,
        isPopular: true,
        latitude: 19.187,
        longitude: 72.848,
        status: 'APPROVED',
      } as any,
    }),
    prisma.restaurant.upsert({
      where: { id: 'rest-5' },
      update: { status: 'APPROVED' } as any,
      create: {
        id: 'rest-5',
        name: 'South Indian Delight',
        description: 'Dadar, Mumbai',
        imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&h=400&fit=crop',
        cuisines: ['South Indian', 'Dosa', 'Idli', 'Veg'],
        rating: 4.6,
        totalRatings: 4200,
        deliveryTime: '30-40 min',
        deliveryFee: 29,
        minOrder: 179,
        isOpen: true,
        isPopular: true,
        latitude: 19.018,
        longitude: 72.841,
        status: 'APPROVED',
      } as any,
    }),
    prisma.restaurant.upsert({
      where: { id: 'rest-6' },
      update: { status: 'APPROVED' } as any,
      create: {
        id: 'rest-6',
        name: 'Sushi Station',
        description: 'Lower Parel, Mumbai',
        imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop',
        cuisines: ['Japanese', 'Sushi', 'Ramen', 'Asian'],
        rating: 4.7,
        totalRatings: 760,
        deliveryTime: '40-50 min',
        deliveryFee: 59,
        minOrder: 499,
        isOpen: true,
        latitude: 18.994,
        longitude: 72.825,
        status: 'APPROVED',
      } as any,
    }),
    prisma.restaurant.upsert({
      where: { id: 'rest-7' },
      update: { status: 'APPROVED' } as any,
      create: {
        id: 'rest-7',
        name: 'Biryani Bros',
        description: 'Kurla, Mumbai',
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=600&h=400&fit=crop',
        cuisines: ['Biryani', 'Indian', 'Dum', 'Rice'],
        rating: 4.5,
        totalRatings: 5600,
        deliveryTime: '35-45 min',
        deliveryFee: 39,
        minOrder: 299,
        isOpen: true,
        isPopular: true,
        latitude: 19.069,
        longitude: 72.879,
        status: 'APPROVED',
      } as any,
    }),
    prisma.restaurant.upsert({
      where: { id: 'rest-8' },
      update: { status: 'APPROVED' } as any,
      create: {
        id: 'rest-8',
        name: 'The Wrap Corner',
        description: 'Thane, Mumbai',
        imageUrl: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&h=400&fit=crop',
        cuisines: ['Wraps', 'Sandwich', 'Fast Food', 'Snacks'],
        rating: 4.2,
        totalRatings: 1450,
        deliveryTime: '20-25 min',
        deliveryFee: 19,
        minOrder: 149,
        isOpen: false,
        latitude: 19.218,
        longitude: 72.978,
        status: 'APPROVED',
      } as any,
    }),
  ]);

  console.log(`✅ Created ${restaurants.length} restaurants`);

  // ── Menu items for rest-1: Spice Garden ────────────────────────────────────
  const menuItemsRest1 = [
    { id: 'mi-1-1', restaurantId: 'rest-1', name: 'Butter Chicken', description: 'Tender chicken in a rich, creamy tomato-based curry sauce.', price: 349, category: 'Popular Picks', isVeg: false, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&h=200&fit=crop' },
    { id: 'mi-1-2', restaurantId: 'rest-1', name: 'Paneer Tikka', description: 'Marinated cottage cheese cubes grilled in a tandoor.', price: 279, category: 'Popular Picks', isVeg: true, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop' },
    { id: 'mi-1-3', restaurantId: 'rest-1', name: 'Chicken Biryani', description: 'Long-grain basmati rice cooked with spiced chicken dum style.', price: 329, category: 'Popular Picks', isVeg: false, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=300&h=200&fit=crop' },
    { id: 'mi-1-4', restaurantId: 'rest-1', name: 'Dal Makhani', description: 'Black lentils slow-cooked overnight with butter and cream.', price: 229, category: 'Vegetarian', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop' },
    { id: 'mi-1-5', restaurantId: 'rest-1', name: 'Shahi Paneer', description: 'Cottage cheese in a royal cashew-cream gravy.', price: 299, category: 'Vegetarian', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&h=200&fit=crop' },
    { id: 'mi-1-6', restaurantId: 'rest-1', name: 'Garlic Naan', description: 'Soft leavened bread with garlic baked in tandoor. (2 pcs)', price: 79, category: 'Vegetarian', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=300&h=200&fit=crop' },
    { id: 'mi-1-7', restaurantId: 'rest-1', name: 'Chicken Tikka Masala', description: 'Grilled chicken chunks in vibrant spiced tomato cream sauce.', price: 369, category: 'Non-Veg Mains', isVeg: false, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop' },
    { id: 'mi-1-8', restaurantId: 'rest-1', name: 'Mutton Rogan Josh', description: 'Slow-braised mutton in Kashmiri spices.', price: 449, category: 'Non-Veg Mains', isVeg: false, imageUrl: 'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=300&h=200&fit=crop' },
    { id: 'mi-1-9', restaurantId: 'rest-1', name: 'Mango Lassi', description: 'Chilled yoghurt drink blended with sweet Alphonso mango.', price: 99, category: 'Beverages', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=200&fit=crop' },
  ];

  // ── Menu items for rest-2: Pizza Paradise ──────────────────────────────────
  const menuItemsRest2 = [
    { id: 'mi-2-1', restaurantId: 'rest-2', name: 'Margherita', description: 'Classic tomato base, fresh mozzarella and basil. (7")', price: 249, category: 'Pizzas', isVeg: true, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=200&fit=crop' },
    { id: 'mi-2-2', restaurantId: 'rest-2', name: 'Pepperoni Feast', description: 'Loaded with classic pepperoni slices and mozzarella. (9")', price: 399, category: 'Pizzas', isVeg: false, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300&h=200&fit=crop' },
    { id: 'mi-2-3', restaurantId: 'rest-2', name: 'BBQ Chicken Pizza', description: 'Smoky BBQ sauce, grilled chicken, onions and peppers. (9")', price: 429, category: 'Pizzas', isVeg: false, imageUrl: 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=300&h=200&fit=crop' },
    { id: 'mi-2-4', restaurantId: 'rest-2', name: 'Veggie Supreme', description: 'Capsicum, olives, mushrooms, onions on herbed base. (9")', price: 349, category: 'Pizzas', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=200&fit=crop' },
    { id: 'mi-2-5', restaurantId: 'rest-2', name: 'Garlic Bread', description: 'Toasted ciabatta with garlic herb butter. (4 pcs)', price: 149, category: 'Sides', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1619531040576-f9416740661f?w=300&h=200&fit=crop' },
    { id: 'mi-2-6', restaurantId: 'rest-2', name: 'Caesar Salad', description: 'Crisp romaine, parmesan shavings, house caesar dressing.', price: 199, category: 'Sides', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop' },
    { id: 'mi-2-7', restaurantId: 'rest-2', name: 'Pasta Arrabiata', description: 'Penne in spicy tomato sauce with basil and garlic.', price: 269, category: 'Pasta', isVeg: true, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=300&h=200&fit=crop' },
    { id: 'mi-2-8', restaurantId: 'rest-2', name: 'Chicken Alfredo', description: 'Creamy parmesan sauce with grilled chicken on fettuccine.', price: 349, category: 'Pasta', isVeg: false, imageUrl: 'https://images.unsplash.com/photo-1612182562338-02e8e5b3e75a?w=300&h=200&fit=crop' },
  ];

  // ── Menu items for rest-3: Dragon Palace ───────────────────────────────────
  const menuItemsRest3 = [
    { id: 'mi-3-1', restaurantId: 'rest-3', name: 'Veg Spring Rolls', description: 'Crispy rolls stuffed with seasoned vegetables. (6 pcs)', price: 179, category: 'Starters', isVeg: true, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop' },
    { id: 'mi-3-2', restaurantId: 'rest-3', name: 'Dim Sum Basket', description: 'Steamed chicken & prawn dumplings served with dipping sauce. (6 pcs)', price: 269, category: 'Starters', isVeg: false, imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300&h=200&fit=crop' },
    { id: 'mi-3-3', restaurantId: 'rest-3', name: 'Veg Fried Rice', description: 'Wok-tossed rice with seasonal vegetables and soy sauce.', price: 209, category: 'Noodles', isVeg: true, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&h=200&fit=crop' },
    { id: 'mi-3-4', restaurantId: 'rest-3', name: 'Chicken Hakka Noodles', description: 'Stir-fried Hakka noodles with chicken and fresh veggies.', price: 249, category: 'Noodles', isVeg: false, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop' },
    { id: 'mi-3-5', restaurantId: 'rest-3', name: 'Chicken Manchurian', description: 'Crispy chicken in a tangy, spicy Manchurian gravy.', price: 289, category: 'Mains', isVeg: false, imageUrl: 'https://images.unsplash.com/photo-1617196034098-da5a61e40e6e?w=300&h=200&fit=crop' },
  ];

  // ── Menu items for rest-4: Burger Junction ─────────────────────────────────
  const menuItemsRest4 = [
    { id: 'mi-4-1', restaurantId: 'rest-4', name: 'Classic Smash Burger', description: 'Double smashed beef patty, American cheese, pickles, special sauce.', price: 249, category: 'Burgers', isVeg: false, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop' },
    { id: 'mi-4-2', restaurantId: 'rest-4', name: 'Crispy Chicken Burger', description: 'Southern-fried chicken thigh, coleslaw, pickles and mayo.', price: 229, category: 'Burgers', isVeg: false, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=200&fit=crop' },
    { id: 'mi-4-3', restaurantId: 'rest-4', name: 'Veggie Avocado Burger', description: 'Black bean patty, guacamole, tomato and lettuce.', price: 199, category: 'Burgers', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=200&fit=crop' },
    { id: 'mi-4-4', restaurantId: 'rest-4', name: 'Loaded Cheese Fries', description: 'Crispy fries topped with cheddar sauce and jalapeños.', price: 149, category: 'Sides', isVeg: true, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&h=200&fit=crop' },
    { id: 'mi-4-5', restaurantId: 'rest-4', name: 'Buffalo Wings', description: 'Crispy chicken wings tossed in classic buffalo sauce. (6 pcs)', price: 279, category: 'Sides', isVeg: false, imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=300&h=200&fit=crop' },
  ];

  // ── Menu items for rest-5: South Indian Delight ────────────────────────────
  const menuItemsRest5 = [
    { id: 'mi-5-1', restaurantId: 'rest-5', name: 'Masala Dosa', description: 'Crispy rice crepe stuffed with spiced potato filling.', price: 119, category: 'Dosas', isVeg: true, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop' },
    { id: 'mi-5-2', restaurantId: 'rest-5', name: 'Cheese Rava Dosa', description: 'Lacy semolina dosa topped with grated cheese and butter.', price: 149, category: 'Dosas', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1558583055-d7ac00b1adca?w=300&h=200&fit=crop' },
    { id: 'mi-5-4', restaurantId: 'rest-5', name: 'Idli Sambar (4 pcs)', description: 'Steamed soft idlis with piping-hot sambar and 2 chutneys.', price: 99, category: 'Tiffin', isVeg: true, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=200&fit=crop' },
    { id: 'mi-5-5', restaurantId: 'rest-5', name: 'Curd Rice', description: 'Seasoned rice with fresh curd, mustard and curry leaves.', price: 109, category: 'Tiffin', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1546171753-64d1f4dff527?w=300&h=200&fit=crop' },
    { id: 'mi-5-7', restaurantId: 'rest-5', name: 'Filter Coffee', description: 'Traditional South Indian filter coffee with frothy milk.', price: 59, category: 'Beverages', isVeg: true, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop' },
  ];

  // ── Menu items for rest-6: Sushi Station ───────────────────────────────────
  const menuItemsRest6 = [
    { id: 'mi-6-1', restaurantId: 'rest-6', name: 'California Roll', description: 'Crab, avocado and cucumber in a reverse roll. (8 pcs)', price: 449, category: 'Sushi Rolls', isVeg: false, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1617196034099-8bde5e9b8e19?w=300&h=200&fit=crop' },
    { id: 'mi-6-2', restaurantId: 'rest-6', name: 'Spicy Tuna Roll', description: 'Fresh tuna with spicy mayo and cucumber. (8 pcs)', price: 549, category: 'Sushi Rolls', isVeg: false, imageUrl: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d?w=300&h=200&fit=crop' },
    { id: 'mi-6-3', restaurantId: 'rest-6', name: 'Avocado Roll', description: 'Creamy avocado and cucumber in nori and rice. (8 pcs)', price: 349, category: 'Sushi Rolls', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=200&fit=crop' },
    { id: 'mi-6-4', restaurantId: 'rest-6', name: 'Tonkotsu Ramen', description: 'Rich pork bone broth, chashu pork, soft egg and bamboo shoots.', price: 649, category: 'Ramen', isVeg: false, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop' },
    { id: 'mi-6-5', restaurantId: 'rest-6', name: 'Mushroom Shoyu Ramen', description: 'Soy-based broth with wild mushrooms, tofu and spring onion.', price: 549, category: 'Ramen', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1602850245030-8367de41e0e7?w=300&h=200&fit=crop' },
  ];

  // ── Menu items for rest-7: Biryani Bros ────────────────────────────────────
  const menuItemsRest7 = [
    { id: 'mi-7-1', restaurantId: 'rest-7', name: 'Hyderabadi Chicken Biryani', description: 'Dum-cooked basmati with tender chicken, caramelised onions.', price: 349, category: 'Biryani', isVeg: false, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=300&h=200&fit=crop' },
    { id: 'mi-7-2', restaurantId: 'rest-7', name: 'Mutton Dum Biryani', description: 'Slow dum-braised mutton with saffron and kewra water.', price: 449, category: 'Biryani', isVeg: false, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&h=200&fit=crop' },
    { id: 'mi-7-3', restaurantId: 'rest-7', name: 'Paneer Biryani', description: 'Aromatic basmati with marinated cottage cheese and saffron.', price: 299, category: 'Biryani', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=300&h=200&fit=crop' },
    { id: 'mi-7-5', restaurantId: 'rest-7', name: 'Seekh Kebab', description: 'Juicy minced mutton kebabs from the tandoor with mint chutney. (4 pcs)', price: 279, category: 'Kebabs', isVeg: false, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?w=300&h=200&fit=crop' },
  ];

  // ── Menu items for rest-8: The Wrap Corner ─────────────────────────────────
  const menuItemsRest8 = [
    { id: 'mi-8-1', restaurantId: 'rest-8', name: 'Chicken Tikka Wrap', description: 'Grilled tikka chicken with mint chutney in a toasted whole-wheat wrap.', price: 189, category: 'Wraps', isVeg: false, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=300&h=200&fit=crop' },
    { id: 'mi-8-2', restaurantId: 'rest-8', name: 'Paneer Kathi Roll', description: 'Spiced paneer with onion and peppers wrapped in paratha.', price: 169, category: 'Wraps', isVeg: true, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop' },
    { id: 'mi-8-3', restaurantId: 'rest-8', name: 'Club Sandwich', description: 'Triple-decker with chicken, bacon, egg, lettuce and tomato.', price: 229, category: 'Sandwiches', isVeg: false, imageUrl: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=300&h=200&fit=crop' },
    { id: 'mi-8-5', restaurantId: 'rest-8', name: 'French Fries', description: 'Golden crispy fries with sea salt.', price: 99, category: 'Sides', isVeg: true, imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300&h=200&fit=crop' },
  ];

  // ── ₹1 Test item ───────────────────────────────────────────────────────────
  const testItems = [
    { id: 'mi-test-1', restaurantId: 'rest-4', name: '🧪 Test Item (₹1)', description: 'Dummy item for payment gateway testing. Do not order!', price: 1, category: 'Popular Picks', isVeg: true, isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop' },
  ];

  const allMenuItems = [
    ...menuItemsRest1, ...menuItemsRest2, ...menuItemsRest3, ...menuItemsRest4,
    ...menuItemsRest5, ...menuItemsRest6, ...menuItemsRest7, ...menuItemsRest8,
    ...testItems,
  ];

  for (const item of allMenuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }

  console.log(`✅ Seeded ${allMenuItems.length} menu items`);
  */

  // ── Default Admin User ─────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('admin@23', 12);
  await prisma.user.upsert({
    where: { email: 'admin@swaree.com' },
    update: { passwordHash: adminPasswordHash },
    create: {
      name: 'Admin',
      email: 'admin@swaree.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log('👑 Admin user seeded: admin@swaree.com / admin@23');

  console.log('🎉 Done!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
