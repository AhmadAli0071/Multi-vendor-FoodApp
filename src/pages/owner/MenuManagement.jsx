import React, { useState } from 'react';
import {
  Plus, Trash2, Edit3, X, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { useOwner } from '../../context/OwnerContext';
import { ownerApi } from '../../utils/ownerApi';
import toast from 'react-hot-toast';

const MenuManagement = () => {
  const {
    menu, addCategory, updateCategory, deleteCategory,
    addMenuItem, updateMenuItem, deleteMenuItem
  } = useOwner();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCat, setExpandedCat] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', icon: '🍽️' });
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemCategoryId, setItemCategoryId] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', available: true, popular: false, image: '', prepTime: '' });
  const [uploadingItemImage, setUploadingItemImage] = useState(false);

  const openCatModal = (cat = null) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '🍽️' });
    } else {
      setEditingCat(null);
      setCatForm({ name: '', description: '', icon: '🍽️' });
    }
    setShowCatModal(true);
  };

  // Filter items based on search
  const isItemMatch = (item) => {
    if (!searchTerm) return true;
    return item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.description?.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const handleSaveCategory = () => {
    if (!catForm.name.trim()) return toast.error('Category name is required');
    if (editingCat) {
      updateCategory(editingCat.id, catForm);
      toast.success('Category updated!');
    } else {
      addCategory(catForm);
      toast.success('Category added!');
    }
    setShowCatModal(false);
  };

  const handleDeleteCategory = (catId, catName) => {
    if (window.confirm(`Delete "${catName}" and all its items?`)) {
      deleteCategory(catId);
      toast.success('Category deleted');
    }
  };

  const openItemModal = (categoryId, item = null) => {
    setItemCategoryId(categoryId);
    if (item) {
      setEditingItem(item);
      setItemForm({ name: item.name, description: item.description || '', price: item.price, available: item.available !== false, popular: item.popular || false, image: item.image || '🍽️', prepTime: item.prepTime || '' });
    } else {
      setEditingItem(null);
      setItemForm({ name: '', description: '', price: '', available: true, popular: false, image: '🍽️', prepTime: '' });
    }
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
    if (!itemForm.name.trim()) return toast.error('Item name is required');
    if (!itemForm.price || Number(itemForm.price) <= 0) return toast.error('Valid price is required');
    const data = { ...itemForm, price: Number(itemForm.price) };
    if (editingItem) {
      updateMenuItem(editingItem._id || editingItem.id, data);
      toast.success('Item updated!');
    } else {
      addMenuItem(itemCategoryId, data);
      toast.success('Item added!');
    }
    setShowItemModal(false);
  };

  const filteredCategories = menu.categories.map(cat => ({
    ...cat,
    items: cat.items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
  })).filter(cat => cat.items.length > 0 || !searchTerm);

  const totalItems = menu.categories.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Menu</h1>
          <p className="text-xs text-gray-400">{menu.categories.length} categories · {totalItems} items</p>
        </div>
        <button onClick={() => openCatModal()} className="px-3 py-1.5 bg-[#FF6B35] text-white rounded-lg text-sm font-medium flex items-center gap-1.5">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Search items..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
        />
      </div>

      {/* Categories */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center">
          <div className="text-5xl mb-3">🍽️</div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">No Menu Yet</h3>
          <p className="text-sm text-gray-400 mb-4">Add categories and items</p>
          <button onClick={() => openCatModal()} className="px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-medium">
            Add First Category
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCategories.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-3 cursor-pointer active:bg-gray-50" onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon || '🍽️'}</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">{cat.name}</h3>
                    <p className="text-xs text-gray-400">{cat.items.length} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); openCatModal(cat); }} className="p-1.5 text-gray-400 active:text-[#FF6B35]">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id, cat.name); }} className="p-1.5 text-gray-400 active:text-red-500">
                    <Trash2 size={14} />
                  </button>
                  {expandedCat === cat.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
              </div>

              {expandedCat === cat.id && (
                <div className="border-t border-gray-100">
                  {cat.items.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-xs text-gray-400 mb-3">No items in this category</p>
                      <button onClick={() => openItemModal(cat.id)} className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-medium flex items-center gap-1.5 mx-auto">
                        <Plus size={14} /> Add Item
                      </button>
                    </div>
                  ) : (
                    <>
                      {cat.items.filter(isItemMatch).length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-400">No matching items</div>
                      ) : (
                        cat.items.filter(isItemMatch).map(item => (
                          <div key={item._id || item.id} className="flex items-center justify-between px-3 py-2.5 border-b border-gray-50 last:border-b-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                {item.image && (item.image.startsWith('data:image') || item.image.startsWith('http') || item.image.startsWith('/uploads')) ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-lg">{item.image || '🍽️'}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-800 truncate">{item.name}</h4>
                                <p className="text-xs text-gray-400 truncate">{item.description}</p>
                              </div>
                              <div className="text-sm font-bold text-[#FF6B35] flex-shrink-0 whitespace-nowrap">PKR {Number(item.price).toLocaleString()}</div>
                              <button onClick={(e) => { e.stopPropagation(); openItemModal(cat.id, item); }} className="p-2 text-gray-400 hover:text-[#FF6B35]">
                                <Edit3 size={14} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); deleteMenuItem(cat.id, item._id || item.id); }} className="p-2 text-gray-400 hover:text-red-500">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                      <div className="px-3 py-2 border-t border-gray-100">
                        <button onClick={() => openItemModal(cat.id)} className="w-full py-1.5 text-[#FF6B35] text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-orange-50 rounded-lg active:bg-orange-100 transition-colors">
                          <Plus size={14} /> Add Item
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowCatModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl flex flex-col max-h-[90dvh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-base font-bold">{editingCat ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowCatModal(false)} className="p-1"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <input type="text" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Category name" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
              <input type="text" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
              <input type="text" value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} placeholder="Emoji icon" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
            </div>
            <div className="flex gap-2 p-4 border-t bg-white">
              <button onClick={() => setShowCatModal(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
              <button onClick={handleSaveCategory} className="flex-1 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-medium">{editingCat ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowItemModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl flex flex-col max-h-[90dvh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-base font-bold">{editingItem ? 'Edit Item' : 'New Item'}</h2>
              <button onClick={() => setShowItemModal(false)} className="p-1"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <input type="text" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Item name" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
              <textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} rows={3} placeholder="Description" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35] resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} placeholder="Price (PKR)" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
                <input type="text" value={itemForm.prepTime} onChange={(e) => setItemForm({ ...itemForm, prepTime: e.target.value })} placeholder="Prep time (e.g. 15 min)" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Image</label>
                <div className="flex gap-2">
                  <input type="text" value={itemForm.image} onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })} placeholder="Emoji or image URL" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
                  <label className="px-3 py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-500 cursor-pointer hover:border-[#FF6B35] flex items-center gap-1">
                    📷 Upload
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setUploadingItemImage(true);
                        try {
                          const url = await ownerApi.uploadImage(f);
                          setItemForm({ ...itemForm, image: url });
                          toast.success('Image uploaded!');
                        } catch (err) {
                          toast.error('Upload failed');
                        } finally {
                          setUploadingItemImage(false);
                        }
                      }
                    }} />
                  </label>
                </div>
                {uploadingItemImage && <span className="text-xs text-gray-400">Uploading...</span>}
                {itemForm.image && !itemForm.image.startsWith('data:image') && !itemForm.image.startsWith('http') && !itemForm.image.startsWith('/uploads') && itemForm.image.length > 1 && (
                  <span className="text-xs text-gray-500 mt-1 block">{itemForm.image}</span>
                )}
                {itemForm.image && (itemForm.image.startsWith('data:image') || itemForm.image.startsWith('http') || itemForm.image.startsWith('/uploads')) && (
                  <img src={itemForm.image} className="mt-2 w-full h-24 object-cover rounded-xl border" alt="Preview" />
                )}
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={itemForm.available} onChange={(e) => setItemForm({ ...itemForm, available: e.target.checked })} className="w-4 h-4 accent-[#FF6B35]" />
                  <span className="text-sm">Available</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={itemForm.popular} onChange={(e) => setItemForm({ ...itemForm, popular: e.target.checked })} className="w-4 h-4 accent-[#FF6B35]" />
                  <span className="text-sm">Popular</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t bg-white">
              <button onClick={() => setShowItemModal(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
              <button onClick={handleSaveItem} className="flex-1 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-medium">{editingItem ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;