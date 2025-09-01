import React, { useState, useEffect } from 'react';
import { User, X, Plus } from 'lucide-react';
import axios from 'axios';

const MyProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'Shipping',
    street: '',
    city: '',
    state: '',
    zip: '',
    isDefault: false
  });

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/login'; return; }
      try {
        const res = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('User data:', res.data);
        console.log('Profile Image:', res.data.profileImage);
        setUser(res.data);
        setFormData({ name: res.data.name || '', phone: res.data.phone || '' });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    };
    fetchUser();
  }, []);

  // Fetch addresses
  useEffect(() => {
    if (user) {
      axios.get('http://localhost:5000/api/addresses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(res => setAddresses(res.data))
        .catch(console.error);
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Profile image URL
  const imageUrl = user.profileImage ? `http://localhost:5000/${user.profileImage}` : '';

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Upload profile image
  const uploadProfileImage = async () => {
    if (!selectedFile) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('profileImage', selectedFile);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/profile/upload-image', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Uploaded Image:', res.data.profileImage); // Log the uploaded image
      setUser(prev => ({ ...prev, profileImage: res.data.profileImage }));
      setSelectedFile(null);
      setPreviewImage('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  // Update profile info
  const handleProfileUpdate = async () => {
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }
    setUpdatingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5000/api/profile', {
        name: formData.name.trim(),
        phone: formData.phone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(prev => ({ ...prev, name: res.data.name, phone: res.data.phone }));
      setEditMode(false);
    } catch (err) {
      console.error(err);
      alert('Error updating profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Address handlers
  const handleNewAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleAddAddress = () => {
    setAddingAddress(prev => !prev);
  };

  const addAddress = async () => {
    try {
      await axios.post('http://localhost:5000/api/addresses', newAddress, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Refresh addresses
      const res = await axios.get('http://localhost:5000/api/addresses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAddresses(res.data);
      setAddingAddress(false);
      setNewAddress({
        type: 'Shipping',
        street: '',
        city: '',
        state: '',
        zip: '',
        isDefault: false
      });
    } catch (err) {
      console.error(err);
    }
  };

  const setDefaultAddress = async (addressId) => {
    await axios.put(`http://localhost:5000/api/addresses/${addressId}/default`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    // Refresh
    const res = await axios.get('http://localhost:5000/api/addresses', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setAddresses(res.data);
  };

  const deleteAddress = async (addressId) => {
    await axios.delete(`http://localhost:5000/api/addresses/${addressId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const res = await axios.get('http://localhost:5000/api/addresses', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setAddresses(res.data);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Heading */}
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      {/* Profile Card */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar with profile image */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
              {previewImage ? (
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
              ) : imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <User className="text-gray-400 w-8 h-8" />
              )}
            </div>
            <div>
              <p className="font-semibold">{user.name || 'User'}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          {/* Header Buttons */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            {editMode ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-3 py-1 border rounded text-gray-700 hover:bg-gray-100"
                  disabled={updatingProfile}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileUpdate}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                  disabled={updatingProfile}
                >
                  {updatingProfile ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4h4a8 8 0 01-8 8z" />
                    </svg>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
            )}
          </div>

          {/* Profile Image Upload */}
          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {previewImage ? (
                  <>
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        setPreviewImage('');
                        setSelectedFile(null);
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : imageUrl ? (
                  <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-gray-400 w-8 h-8" />
                )}
              </div>
              <div>
                <label className="cursor-pointer text-blue-600 text-sm font-medium">
                  <input
                    type="file"
                    accept="image/jpeg, image/png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  Change Photo
                </label>
                <p className="text-xs text-gray-500">JPEG or PNG, Max 2MB</p>
                {selectedFile && (
                  <button
                    onClick={uploadProfileImage}
                    className="mt-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4h4a8 8 0 01-8 8z" />
                      </svg>
                    ) : (
                      'Upload'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              {editMode ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              ) : (
                <div className="p-2 border rounded bg-gray-50">{user.name || 'Not provided'}</div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="p-2 border rounded bg-gray-50">{user.email}</div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              {editMode ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              ) : (
                <div className="p-2 border rounded bg-gray-50">{user.phone || 'Not provided'}</div>
              )}
            </div>
          </div>

          {/* Addresses Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-2 flex items-center justify-between">
              <span>Addresses</span>
              <button
                onClick={toggleAddAddress}
                className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Address
              </button>
            </h2>

            {addingAddress && (
              <div className="border p-4 mb-4 rounded bg-gray-50">
                <h3 className="mb-2 font-semibold">New Address</h3>
                <div className="mb-2">
                  <label className="block text-sm mb-1">Type</label>
                  <select
                    name="type"
                    value={newAddress.type}
                    onChange={handleNewAddressChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Shipping">Shipping</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-sm mb-1">Street</label>
                  <input
                    type="text"
                    name="street"
                    value={newAddress.street}
                    onChange={handleNewAddressChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={newAddress.city}
                    onChange={handleNewAddressChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={newAddress.state}
                    onChange={handleNewAddressChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm mb-1">ZIP</label>
                  <input
                    type="text"
                    name="zip"
                    value={newAddress.zip}
                    onChange={handleNewAddressChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-2 flex items-center">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={newAddress.isDefault}
                    onChange={handleNewAddressChange}
                    className="mr-2"
                  />
                  <label className="text-sm">Set as default</label>
                </div>
                <button
                  onClick={addAddress}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save Address
                </button>
              </div>
            )}

            {/* List of Addresses */}
            {addresses.length === 0 ? (
              <p>No addresses added yet.</p>
            ) : (
              <ul>
                {addresses.map(addr => (
                  <li key={addr._id} className="border p-2 mb-2 rounded bg-gray-50">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <strong>{addr.type}:</strong> {addr.street}, {addr.city}, {addr.state} {addr.zip}
                        {addr.isDefault && (
                          <span className="ml-2 text-green-600 font-semibold">(Default)</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {!addr.isDefault && (
                          <button
                            onClick={() => setDefaultAddress(addr._id)}
                            className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => deleteAddress(addr._id)}
                          className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;