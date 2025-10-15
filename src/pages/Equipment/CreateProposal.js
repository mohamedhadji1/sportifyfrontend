import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiUpload, FiX, FiSave, FiArrowLeft, FiCheck, FiClock, FiDollarSign, FiPackage, FiTag, FiImage, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const CreateProposal = ({ onBack, onSuccess }) => {
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type: '',
    description: '',
    brand: '',
    model: '',
    condition: 'Good',
    estimatedValue: '',
    justification: '',
    priority: 'Medium',
    tags: [],
    // Nouveaux champs pour e-commerce
    suggestedPrice: '',
    suggestedStock: '',
    forEcommerce: false
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error'

  // Show loading spinner while auth is being checked
  if (authLoading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-400 rounded-full animate-spin" 
                style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
            <p className="mt-4 text-white/80 text-lg">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  // Show error message if user is not authenticated
  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-12"
          >
            <FiAlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-white/60">Please log in to create equipment proposals.</p>
          </motion.div>
        </div>
      </>
    );
  }

  const categories = [
    'Football', 'Basketball', 'Tennis', 'Volleyball', 
    'Swimming', 'Gym', 'Track & Field', 'Other'
  ];

  const equipmentTypes = [
    'Ball', 'Net', 'Goal', 'Racket', 'Weight', 'Machine', 
    'Protective Gear', 'Training Equipment', 'Accessory', 'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum 5MB allowed.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, {
          file,
          preview: e.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.type || !formData.description || !formData.justification) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const submitData = new FormData();
      
      // Add form data
      Object.keys(formData).forEach(key => {
        if (key === 'tags') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === 'forEcommerce') {
          submitData.append(key, formData[key]);
        } else if (key === 'suggestedPrice') {
          submitData.append(key, formData[key] || '0');
        } else if (key === 'suggestedStock') {
          submitData.append(key, formData[key] || '0');
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Add images
      images.forEach(image => {
        submitData.append('images', image.file);
      });

      console.log('Submitting form data:', Object.fromEntries(submitData.entries()));

      const response = await fetch('https://sportify-equipement.onrender.com/api/proposals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      if (response.ok) {
        const result = await response.json();
        setSubmissionStatus('success');
        if (onSuccess) onSuccess(result.data);
        
        // Reset form
        setFormData({
          name: '',
          category: '',
          type: '',
          description: '',
          brand: '',
          model: '',
          condition: 'Good',
          estimatedValue: '',
          justification: '',
          priority: 'Medium',
          tags: [],
          suggestedPrice: '',
          suggestedStock: '',
          forEcommerce: false
        });
        setImages([]);
      } else {
        const error = await response.json();
        setSubmissionStatus('error');
        alert(error.message || 'Error creating proposal');
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      setSubmissionStatus('error');
      alert('Error creating proposal');
    } finally {
      setLoading(false);
    }
  };

  // Success/Error Message Component
  const StatusMessage = () => {
    if (!submissionStatus) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`mb-6 p-5 rounded-xl border backdrop-blur-sm ${
            submissionStatus === 'success' 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}
        >
          <div className="flex items-center">
            {submissionStatus === 'success' ? (
              <FiCheck className="w-6 h-6 mr-3 text-green-400" />
            ) : (
              <FiAlertCircle className="w-6 h-6 mr-3 text-red-400" />
            )}
            <span className={`font-semibold ${
              submissionStatus === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              {submissionStatus === 'success' 
                ? 'Equipment proposal created successfully!' 
                : 'Error creating proposal. Please try again.'
              }
            </span>
          </div>
          {submissionStatus === 'success' && (
            <p className="mt-2 text-sm text-white/70 ml-9">
              Your proposal will be reviewed by managers and administrators. 
              {formData.forEcommerce && ' If approved, it may be added to the equipment shop.'}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-900/50 to-purple-900/50 py-16">
          <div className="absolute inset-0 bg-black/30"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-6">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="flex items-center text-white/80 hover:text-white transition-all hover:scale-105 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm"
                  >
                    <FiArrowLeft className="w-5 h-5 mr-2" />
                    Back
                  </button>
                )}
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center">
                    <FiPackage className="w-10 h-10 mr-3 text-blue-400" />
                    Create Equipment Proposal
                  </h1>
                  <p className="text-lg text-white/80">
                    Propose new equipment for your facility. All proposals require approval.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <StatusMessage />

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <FiPackage className="w-6 h-6 mr-2 text-blue-400" />
                Basic Information
              </h3>
          
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                    placeholder="e.g., Professional Soccer Ball"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm cursor-pointer transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Equipment Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm cursor-pointer transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900">Select Type</option>
                    {equipmentTypes.map(type => (
                      <option key={type} value={type} className="bg-gray-900">{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm cursor-pointer transition-all appearance-none"
                  >
                    <option value="Low" className="bg-gray-900">Low</option>
                    <option value="Medium" className="bg-gray-900">Medium</option>
                    <option value="High" className="bg-gray-900">High</option>
                    <option value="Urgent" className="bg-gray-900">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                    placeholder="e.g., Nike, Adidas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                    placeholder="Model number or name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm cursor-pointer transition-all appearance-none"
                  >
                    <option value="Excellent" className="bg-gray-900">Excellent</option>
                    <option value="Good" className="bg-gray-900">Good</option>
                    <option value="Fair" className="bg-gray-900">Fair</option>
                    <option value="Poor" className="bg-gray-900">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Estimated Value ($)
                  </label>
                  <input
                    type="number"
                    name="estimatedValue"
                    value={formData.estimatedValue}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all resize-none"
                  placeholder="Detailed description of the equipment..."
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Justification *
                </label>
                <textarea
                  name="justification"
                  value={formData.justification}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all resize-none"
                  placeholder="Why is this equipment needed? How will it benefit the facility/team?"
                />
              </div>
            </motion.div>

            {/* E-commerce Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <FiDollarSign className="w-6 h-6 mr-2 text-green-400" />
                E-commerce Information (Optional)
              </h3>
          
              <div className="space-y-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="forEcommerce"
                    id="forEcommerce"
                    checked={formData.forEcommerce}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-white/20 rounded bg-white/10"
                  />
                  <label htmlFor="forEcommerce" className="ml-3 block text-sm font-medium text-white">
                    Consider this equipment for the equipment shop
                  </label>
                </div>

                {formData.forEcommerce && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10"
                  >
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Suggested Sale Price ($)
                      </label>
                      <input
                        type="number"
                        name="suggestedPrice"
                        value={formData.suggestedPrice}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                        placeholder="0.00"
                      />
                      <p className="mt-2 text-xs text-white/60">
                        Suggested price for selling in the equipment shop
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Suggested Initial Stock
                      </label>
                      <input
                        type="number"
                        name="suggestedStock"
                        value={formData.suggestedStock}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                        placeholder="0"
                      />
                      <p className="mt-2 text-xs text-white/60">
                        How many units should be initially available
                      </p>
                    </div>
                  </motion.div>
                )}

                {formData.forEcommerce && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm"
                  >
                    <div className="flex">
                      <FiClock className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-400">E-commerce Approval Process</h4>
                        <p className="mt-1 text-sm text-white/70">
                          Equipment marked for e-commerce will require additional approval from administrators 
                          before appearing in the shop. This includes price and inventory verification.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <FiImage className="w-6 h-6 mr-2 text-purple-400" />
                Images (Optional)
              </h3>
            
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center px-6 py-3 border border-white/20 rounded-xl shadow-sm bg-white/10 text-sm font-medium text-white hover:bg-white/20 cursor-pointer transition-all backdrop-blur-sm"
                >
                  <FiUpload className="w-5 h-5 mr-2" />
                  Upload Images
                </label>
                <p className="mt-3 text-sm text-white/60">
                  Maximum 5 images, 5MB each. Supported formats: JPG, PNG, GIF
                </p>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {images.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group"
                    >
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-xl border border-white/20 backdrop-blur-sm"
                      />
                      <motion.button
                        type="button"
                        onClick={() => removeImage(index)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <FiX className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <FiTag className="w-6 h-6 mr-2 text-yellow-400" />
                Tags (Optional)
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.tags.map((tag, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  >
                    {tag}
                    <motion.button
                      type="button"
                      onClick={() => removeTag(tag)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="ml-2 text-blue-400 hover:text-blue-300"
                    >
                      <FiX className="w-4 h-4" />
                    </motion.button>
                  </motion.span>
                ))}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                  placeholder="Add tags to help categorize..."
                />
                <motion.button
                  type="button"
                  onClick={addTag}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all backdrop-blur-sm font-medium"
                >
                  Add
                </motion.button>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-end space-x-4 pt-6"
            >
              <motion.button
                type="button"
                onClick={onBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 border border-white/20 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-semibold hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiSave className="w-5 h-5 mr-2" />
                    Create Proposal
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateProposal;