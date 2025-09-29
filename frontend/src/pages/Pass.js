import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { toast } from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function Pass() {
  const { id } = useParams();
  const [passData, setPassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPassData = async () => {
      try {
        const response = await authAPI.getPass(id);
        setPassData(response.data);
      } catch (error) {
        console.error('Error fetching pass data:', error);
        toast.error('Failed to load pass. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPassData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-garba-yellow"></div>
      </div>
    );
  }

  if (!passData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Pass Not Found</h2>
        <p className="text-gray-300">The requested pass could not be found or has expired.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-garba-dark to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
          {/* Pass Header */}
          <div className="bg-gradient-to-r from-garba-orange to-garba-yellow p-6 text-center">
            <h1 className="text-3xl font-bold text-white">Garba Gravity</h1>
            <p className="text-white font-medium">Exclusive Digital Pass</p>
          </div>
          
          {/* Pass Content */}
          <div className="p-8 md:flex">
            {/* Left Side - QR Code */}
            <div className="md:w-1/3 flex flex-col items-center justify-center mb-6 md:mb-0">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <QRCode 
                  value={passData.qrCodeData || passData._id}
                  size={200}
                  level="H"
                  className="w-full h-auto"
                />
              </div>
              <p className="mt-4 text-sm text-gray-300 text-center">
                Scan this QR code at the venue
              </p>
            </div>
            
            {/* Right Side - User Details */}
            <div className="md:w-2/3 md:pl-8 border-l border-gray-700">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-garba-yellow mb-2">{passData.name}</h2>
                <p className="text-gray-300">{passData.college}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Pass ID</h3>
                  <p className="mt-1 text-white">{passData._id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Email</h3>
                  <p className="mt-1 text-white break-all">{passData.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Status</h3>
                  <span className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    passData.status === 'verified' ? 'bg-green-100 text-green-800' :
                    passData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {passData.status.charAt(0).toUpperCase() + passData.status.slice(1)}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Issued On</h3>
                  <p className="mt-1 text-white">
                    {new Date(passData.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Event Details</h3>
                <p className="text-white">
                  Garba Gravity - The Ultimate Cultural Experience
                </p>
                <p className="text-gray-300 text-sm mt-1">
                  Venue: IIIT Kota, Rajasthan<br />
                  Date: October 20-22, 2023
                </p>
              </div>
            </div>
          </div>
          
          {/* Pass Footer */}
          <div className="bg-gray-900 bg-opacity-50 p-4 text-center">
            <p className="text-xs text-gray-400">
              This is an auto-generated pass. Please present this at the venue for entry.
              For any queries, contact: cacs@iiitkota.ac.in
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-garba-orange hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garba-orange"
          >
            Print or Save Pass
          </button>
        </div>
      </div>
      
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #pass-container, #pass-container * {
            visibility: visible;
          }
          #pass-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
