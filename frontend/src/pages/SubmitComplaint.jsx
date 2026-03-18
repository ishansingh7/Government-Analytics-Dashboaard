import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Send, AlertCircle } from 'lucide-react';

const SubmitComplaint = () => {
  const [ministries, setMinistries] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ministryId: '',
    projectType: 'General',
    location: '',
    attachments: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMinistries = async () => {
      try {
        const { data } = await api.get('/ministries');
        setMinistries(data);
      } catch (err) {
        console.error('Failed to load ministries', err);
        setError('Failed to load ministries. Please try again later.');
      }
    };
    fetchMinistries();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/complaints', {
        title: formData.title,
        description: formData.description,
        ministryId: formData.ministryId,
        location: formData.location,
        projectType: formData.projectType,
        attachments: formData.attachments,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-primary/5 px-6 py-8 border-b border-primary/10">
          <div className="flex items-center justify-center mb-4">
             <div className="bg-primary/20 p-3 rounded-full">
               <Send className="h-8 w-8 text-primary" />
             </div>
          </div>
          <h2 className="text-3xl font-extrabold text-center text-gray-900">File a New Complaint</h2>
          <p className="mt-2 text-center text-gray-600">
            Your complaint will be securely routed to the assigned ministry.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded bg-red-50 flex items-start">
               <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
               <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complaint Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition"
              placeholder="Brief summary of your issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Ministry <span className="text-red-500">*</span>
            </label>
            <select
              name="ministryId"
              required
              value={formData.ministryId}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md transition"
            >
              <option value="" disabled>Select the relevant department</option>
              {ministries.map(ministry => (
                <option key={ministry._id} value={ministry._id}>{ministry.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type of Project</label>
              <select
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary rounded-md shadow-sm placeholder-gray-400 focus:border-primary sm:text-sm rounded-md transition"
              >
                <option value="General">General</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Education">Education</option>
                <option value="Health">Health</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition"
                placeholder="City, District, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo/video (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const formDataUpload = new FormData();
                formDataUpload.append('file', file);

                try {
                  const res = await api.post('/complaints/upload', formDataUpload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });

                  setFormData((prev) => ({
                    ...prev,
                    attachments: [...(prev.attachments || []), res.data.url],
                  }));
                } catch (err) {
                  console.error('Upload failed', err);
                  setError('Failed to upload photo. Please try again.');
                }
              }}
              className="block w-full text-sm text-gray-600 
file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 
file:text-sm file:font-semibold 
file:bg-[#2E4897] file:text-white 
file:cursor-pointer 
hover:file:bg-[#1f3575] transition"
/>
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.attachments.map((url) => (
                  <div key={url} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                      View uploaded photo
                    </a>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        attachments: prev.attachments.filter((item) => item !== url),
                      }))}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={5}
              value={formData.description}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition"
              placeholder="Please provide as much detail as possible to help us resolve the issue quickly..."
            />
          </div>

          <div className="pt-4">
            <button
  type="submit"
  disabled={loading}
  className={`w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-md text-sm font-semibold text-white ${
    loading
      ? 'bg-blue-400 cursor-not-allowed'
      : 'bg-[#2E4897] hover:bg-[#1f3575] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E4897]'
  } transition duration-200`}
>
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;
