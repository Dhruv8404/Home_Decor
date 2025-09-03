import React from 'react';
import { CheckCircle, Clock, Truck, Package, MapPin } from 'lucide-react';

const OrderStatusProgress = ({ status, createdAt }) => {
  // Define the order status steps
  const steps = [
    { key: 'ordered', label: 'Ordered', icon: Package },
    { key: 'placed', label: 'Placed', icon: Clock },
    { key: 'processing', label: 'Processing', icon: Truck },
    { key: 'shipped', label: 'Shipped', icon: MapPin },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];

  // Map order status to step index
  const getCurrentStepIndex = (status) => {
    switch (status) {
      case 'Placed':
        return 1;
      case 'Processing':
        return 2;
      case 'Shipped':
        return 3;
      case 'Delivered':
        return 4;
      case 'Cancelled':
        return -1; // Special case for cancelled
      default:
        return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex(status);
  const isCancelled = status === 'Cancelled';
  const isCompleted = status === 'Delivered';

  // Calculate progress percentage
  const progressPercentage = isCancelled ? 0 : Math.max(0, (currentStepIndex / (steps.length - 1)) * 100);

  return (
    <div className="w-full py-6">
      {/* Progress Bar */}
      <div className="relative mb-8">
        {/* Background line */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>

        {/* Progress line */}
        <div
          className={`absolute top-4 left-0 h-1 rounded-full transition-all duration-1000 ease-out ${
            isCancelled
              ? 'bg-red-400'
              : isCompleted
                ? 'bg-green-500'
                : 'bg-blue-500'
          }`}
          style={{ width: `${progressPercentage}%` }}
        ></div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index <= currentStepIndex && !isCancelled;
            const isCurrent = index === currentStepIndex && !isCancelled;
            const isCompletedStep = index < currentStepIndex && !isCancelled;

            return (
              <div key={step.key} className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCancelled
                      ? 'bg-red-100 border-2 border-red-400'
                      : isCompletedStep
                        ? 'bg-green-500 border-2 border-green-500'
                        : isActive
                          ? 'bg-blue-500 border-2 border-blue-500'
                          : 'bg-gray-200 border-2 border-gray-300'
                  }`}
                >
                  <StepIcon
                    className={`w-4 h-4 transition-colors duration-500 ${
                      isCancelled
                        ? 'text-red-600'
                        : isCompletedStep
                          ? 'text-white'
                          : isActive
                            ? 'text-white'
                            : 'text-gray-400'
                    }`}
                  />
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-medium transition-colors duration-500 ${
                      isCancelled
                        ? 'text-red-600'
                        : isActive
                          ? 'text-blue-600'
                          : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && !isCancelled && (
                    <p className="text-xs text-blue-500 mt-1 font-semibold">Current</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Information */}
      <div className="text-center">
        {isCancelled ? (
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <Clock className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Order Cancelled</span>
          </div>
        ) : isCompleted ? (
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Order Delivered Successfully!</span>
          </div>
        ) : (
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Truck className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {status === 'Placed' && 'Order Confirmed'}
              {status === 'Processing' && 'Order Being Processed'}
              {status === 'Shipped' && 'Order Out for Delivery'}
            </span>
          </div>
        )}

        {/* Order Date */}
        <p className="text-xs text-gray-500 mt-2">
          Ordered on {new Date(createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
};

export default OrderStatusProgress;
