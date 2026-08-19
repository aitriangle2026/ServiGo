const Category = require("../models/Category");

const createCategory = async (categoryData) => {
  const existingCategory = await Category.findOne({
    name: categoryData.name,
  });

  if (existingCategory) {
    throw new Error("Category already exists");
  }

  const category = await Category.create(categoryData);

  return category;
};

const getAllCategories = async () => {
  return await Category.find().sort({ createdAt: -1 });
};

const updateCategory = async (id, categoryData) => {
  const category = await Category.findByIdAndUpdate(
    id,
    categoryData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};

const deleteCategory = async (id) => {
  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};