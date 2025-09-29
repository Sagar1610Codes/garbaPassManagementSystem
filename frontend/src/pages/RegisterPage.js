import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function RegisterPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college: '',
    aadharNumber: '',
    password: '',
    confirmPassword: '',
    collegeIdPhoto: null,
    aadharPhoto: null,
  });
  
  const [preview, setPreview] = useState({
    collegeIdPhoto: null,
    aadharPhoto: null,
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  // Verify token and fetch user email on component mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await authAPI.verifyInvitation(token);
        if (response.data.email) {
          setFormData(prev => ({
            ...prev,
            email: response.data.email
          }));
        }
        setIsVerifying(false);
      } catch (error) {
        console.error('Token verification failed:', error);
        toast.error('Invalid or expired invitation link');
        navigate('/');
      }
    };

    if (token) {
      verifyToken();
    } else {
      setIsVerifying(false);
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    // Clear any existing errors for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Please upload a valid image (JPEG/PNG) or PDF file'
        }));
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          [name]: 'File size should be less than 5MB'
        }));
        return;
      }
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const fileUrl = URL.createObjectURL(file);
        setPreview(prev => ({
          ...prev,
          [name]: fileUrl
        }));
      } else {
        // For non-image files, show a generic preview
        setPreview(prev => ({
          ...prev,
          [name]: null
        }));
      }
      
      // Update form data with the file
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      // For regular input fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.college.trim()) newErrors.college = 'College name is required';
    if (!formData.aadharNumber) newErrors.aadharNumber = 'Aadhar number is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.collegeIdPhoto) newErrors.collegeIdPhoto = 'College ID photo is required';
    if (!formData.aadharPhoto) newErrors.aadharPhoto = 'Aadhar photo is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit Clicked")
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create a new FormData instance
      const formDataToSend = new FormData();
      
      // Append all form fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('college', formData.college);
      formDataToSend.append('aadharNumber', formData.aadharNumber);
      formDataToSend.append('password', formData.password);
      
      // Append files if they exist
      if (formData.collegeIdPhoto) {
        formDataToSend.append('collegeIdPhoto', formData.collegeIdPhoto);
      }
      if (formData.aadharPhoto) {
        formDataToSend.append('aadharPhoto', formData.aadharPhoto);
      }
      
      // Log form data for debugging
      console.log('Form data to send:', {
        name: formData.name,
        email: formData.email,
        college: formData.college,
        aadharNumber: formData.aadharNumber,
        hasCollegeIdPhoto: !!formData.collegeIdPhoto,
        hasAadharPhoto: !!formData.aadharPhoto,
      });
      
      // Log files being sent
      if (formData.collegeIdPhoto) {
        console.log('College ID photo:', formData.collegeIdPhoto.name, formData.collegeIdPhoto.type, formData.collegeIdPhoto.size);
      }
      if (formData.aadharPhoto) {
        console.log('Aadhar photo:', formData.aadharPhoto.name, formData.aadharPhoto.type, formData.aadharPhoto.size);
      }
      
      // Log the actual FormData entries
      console.log('FormData entries:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }
      
      // Use the API client with the correct endpoint
      const response = await authAPI.register(formDataToSend, token);
      console.log('Registration response:', response);
      
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-garba-yellow mx-auto mb-4"></div>
          <p className="text-gray-300">Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-garba-yellow mb-2 font-display">
                Garba Pass Registration
              </h2>
              <p className="text-gray-400">
                Complete your registration to get your exclusive Garba Pass
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-lg bg-gray-800 border ${
                        errors.name ? 'border-red-500' : 'border-gray-700'
                      } text-white px-4 py-3 focus:ring-2 focus:ring-garba-yellow focus:border-transparent transition duration-200`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!!token}
                      className="mt-1 block w-full rounded-lg bg-gray-800 border border-gray-700 text-gray-300 px-4 py-3 focus:ring-2 focus:ring-garba-yellow focus:border-transparent transition duration-200 disabled:opacity-50"
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="college" className="block text-sm font-medium text-gray-300 mb-1">
                      College/Institution <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="college"
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-lg bg-gray-800 border ${
                        errors.college ? 'border-red-500' : 'border-gray-700'
                      } text-white px-4 py-3 focus:ring-2 focus:ring-garba-yellow focus:border-transparent transition duration-200`}
                      placeholder="Enter your college/institution name"
                    />
                    {errors.college && (
                      <p className="mt-1 text-sm text-red-400">{errors.college}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-300 mb-1">
                      Aadhar Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="aadharNumber"
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-lg bg-gray-800 border ${
                        errors.aadharNumber ? 'border-red-500' : 'border-gray-700'
                      } text-white px-4 py-3 focus:ring-2 focus:ring-garba-yellow focus:border-transparent transition duration-200`}
                      placeholder="Enter 12-digit Aadhar number"
                      maxLength="12"
                    />
                    {errors.aadharNumber && (
                      <p className="mt-1 text-sm text-red-400">{errors.aadharNumber}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-lg bg-gray-800 border ${
                        errors.password ? 'border-red-500' : 'border-gray-700'
                      } text-white px-4 py-3 focus:ring-2 focus:ring-garba-yellow focus:border-transparent transition duration-200`}
                      placeholder="Create a password"
                    />
                    {errors.password ? (
                      <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-400">At least 6 characters</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-lg bg-gray-800 border ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-700'
                      } text-white px-4 py-3 focus:ring-2 focus:ring-garba-yellow focus:border-transparent transition duration-200`}
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      College ID Photo <span className="text-red-500">*</span>
                    </label>
                    <label className="flex flex-col items-center px-4 py-6 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 cursor-pointer hover:bg-gray-750 transition duration-200">
                      {preview.collegeIdPhoto ? (
                        <div className="relative w-full">
                          <img 
                            src={preview.collegeIdPhoto} 
                            alt="College ID preview" 
                            className="w-full h-40 object-contain rounded-md mb-2"
                          />
                          <span className="text-xs text-gray-400">Click to change</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="mt-2 flex text-sm text-gray-400">
                            <span className="relative">
                              Upload College ID
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 5MB</p>
                        </div>
                      )}
                      <input
                        id="collegeIdPhoto"
                        name="collegeIdPhoto"
                        type="file"
                        className="sr-only"
                        onChange={handleChange}
                        accept="image/*,.pdf"
                      />
                    </label>
                    {errors.collegeIdPhoto && (
                      <p className="mt-1 text-sm text-red-400">{errors.collegeIdPhoto}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Aadhar Photo/Scan <span className="text-red-500">*</span>
                    </label>
                    <label className="flex flex-col items-center px-4 py-6 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 cursor-pointer hover:bg-gray-750 transition duration-200">
                      {preview.aadharPhoto ? (
                        <div className="relative w-full">
                          <img 
                            src={preview.aadharPhoto} 
                            alt="Aadhar preview" 
                            className="w-full h-40 object-contain rounded-md mb-2"
                          />
                          <span className="text-xs text-gray-400">Click to change</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="mt-2 flex text-sm text-gray-400">
                            <span className="relative">
                              Upload Aadhar
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 5MB</p>
                        </div>
                      )}
                      <input
                        id="aadharPhoto"
                        name="aadharPhoto"
                        type="file"
                        className="sr-only"
                        onChange={handleChange}
                        accept="image/*,.pdf"
                      />
                    </label>
                    {errors.aadharPhoto && (
                      <p className="mt-1 text-sm text-red-400">{errors.aadharPhoto}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-garba-orange hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garba-orange transition duration-200"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
