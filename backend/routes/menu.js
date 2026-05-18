import express from 'express';
import { protect, ownerOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { body, param } from 'express-validator';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';

const router = express.Router();

// Validation rules
const categoryValidation = [
  body('name').notEmpty().withMessage('Category name required'),
  body('name').trim().escape(),
  body('description').optional().trim().escape(),
  body('icon').optional().trim()
];

const itemValidation = [
  body('name').notEmpty().withMessage('Item name required'),
  body('name').trim().escape(),
  body('description').optional().trim().escape(),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('category').notEmpty().withMessage('Category required'),
  body('category').trim(),
  body('isAvailable').optional().isBoolean(),
  body('image').optional().trim()
];

// GET /api/menu - Get menu for logged-in owner's restaurant
router.get('/', protect, ownerOnly, async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ id: req.user.restaurant_id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant.menu || { categories: [] });
  } catch (error) {
    next(error);
  }
});

// PUT /api/menu - Update entire menu (bulk save)
router.put('/', protect, ownerOnly, validate([
  body('categories').optional().isArray()
]), async (req, res, next) => {
  try {
    const { categories } = req.body;

    const restaurant = await Restaurant.findOneAndUpdate(
      { id: req.user.restaurant_id },
      { menu: { categories } },
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json(restaurant.menu);
  } catch (error) {
    next(error);
  }
});

// POST /api/menu/categories - Add category
router.post('/categories', protect, ownerOnly, validate(categoryValidation), async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;

    const restaurant = await Restaurant.findOne({ id: req.user.restaurant_id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (!restaurant.menu) {
      restaurant.menu = { categories: [] };
    }

    const newCategory = {
      _id: new Date().getTime().toString(),
      name,
      description: description || '',
      icon: icon || '🍽️',
      items: []
    };

    restaurant.menu.categories.push(newCategory);
    await restaurant.save();

    res.status(201).json(newCategory);
  } catch (error) {
    next(error);
  }
});

// PUT /api/menu/categories/:categoryId - Update category
router.put('/categories/:categoryId', protect, ownerOnly, validate([
  ...categoryValidation,
  param('categoryId').notEmpty()
]), async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { name, description, icon } = req.body;

    const restaurant = await Restaurant.findOne({ id: req.user.restaurant_id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const category = restaurant.menu.categories.id(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;

    await restaurant.save();
    res.json(category);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/menu/categories/:categoryId - Delete category
router.delete('/categories/:categoryId', protect, ownerOnly, validate([
  param('categoryId').notEmpty()
]), async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const restaurant = await Restaurant.findOne({ id: req.user.restaurant_id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const categoryIndex = restaurant.menu.categories.findIndex(c => c._id == categoryId);
    if (categoryIndex === -1) {
      return res.status(404).json({ message: 'Category not found' });
    }

    restaurant.menu.categories.splice(categoryIndex, 1);
    await restaurant.save();

    res.json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /api/menu/items - Add item to category
router.post('/items', protect, ownerOnly, validate(itemValidation), async (req, res, next) => {
  try {
    const { name, description, price, category, isAvailable = true, image } = req.body;

    const restaurant = await Restaurant.findOne({ id: req.user.restaurant_id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const categoryDoc = restaurant.menu.categories.find(c => c._id === category || c.name === category);
    if (!categoryDoc) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const newItem = {
      _id: new Date().getTime().toString(),
      name,
      description: description || '',
      price,
      isAvailable,
      image: image || '',
      createdAt: new Date()
    };

    categoryDoc.items.push(newItem);
    await restaurant.save();

    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
});

// PUT /api/menu/items/:itemId - Update item
router.put('/items/:itemId', protect, ownerOnly, validate([
  ...itemValidation,
  param('itemId').notEmpty()
]), async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { name, description, price, category, isAvailable, image } = req.body;

    const restaurant = await Restaurant.findOne({ id: req.user.restaurant_id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // If category changed, find new category
    let targetCategory = category;
    if (category) {
      const newCat = restaurant.menu.categories.find(c => c._id === category || c.name === category);
      if (!newCat) {
        return res.status(404).json({ message: 'Target category not found' });
      }
      targetCategory = newCat;
    }

    // Find item in any category
    let foundCategory = null;
    let itemIndex = -1;
    for (const cat of restaurant.menu.categories) {
      const idx = cat.items.findIndex(i => i._id == itemId);
      if (idx !== -1) {
        foundCategory = cat;
        itemIndex = idx;
        break;
      }
    }

    if (!foundCategory || itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const item = foundCategory.items[itemIndex];

    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = price;
    if (isAvailable !== undefined) item.isAvailable = isAvailable;
    if (image !== undefined) item.image = image;

    // If category changed, move item
    if (category && foundCategory._id != category) {
      foundCategory.items.splice(itemIndex, 1);
      targetCategory.items.push(item);
    }

    await restaurant.save();
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/menu/items/:itemId - Delete item
router.delete('/items/:itemId', protect, ownerOnly, validate([
  param('itemId').notEmpty()
]), async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const restaurant = await Restaurant.findOne({ id: req.user.restaurant_id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    for (const category of restaurant.menu.categories) {
      const itemIndex = category.items.findIndex(i => i._id == itemId);
      if (itemIndex !== -1) {
        category.items.splice(itemIndex, 1);
        await restaurant.save();
        return res.json({ message: 'Item deleted' });
      }
    }

    res.status(404).json({ message: 'Item not found' });
  } catch (error) {
    next(error);
  }
});

export default router;
