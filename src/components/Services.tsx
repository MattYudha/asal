"use client";

import { analyticsService } from "../services/analyticsService";
import { supabase } from "../api/supabaseClient"; // Path ini telah dikoreksi
import type React from "react";

interface ServiceProps {
  name: string;
  description: string;
  imageUrl: string;
}

const ServiceCard: React.FC<ServiceProps> = ({
  name,
  description,
  imageUrl,
}) => {
  const handleServiceClick = async (serviceName: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await analyticsService.trackServicePageView(serviceName, user?.id);
  };

  return (
    <div
      className="max-w-sm rounded overflow-hidden shadow-lg"
      onClick={() => handleServiceClick(name)}
    >
      <img className="w-full" src={imageUrl || "/placeholder.svg"} alt={name} />
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">{name}</div>
        <p className="text-gray-700 text-base">{description}</p>
      </div>
    </div>
  );
};

interface ServicesProps {
  services: ServiceProps[];
}

const Services: React.FC<ServicesProps> = ({ services }) => {
  return (
    <div className="container mx-auto py-12">
      <h2 className="text-3xl font-bold text-center mb-8">Our Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <ServiceCard key={index} {...service} />
        ))}
      </div>
    </div>
  );
};

export default Services;
