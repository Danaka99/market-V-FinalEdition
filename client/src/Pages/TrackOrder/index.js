import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from 'axios';

const TrackOrder = () => {
  const {trackingNumber} = useParams();
  const [orderData, setOrderData] = useState([]);

  useEffect(()=>{
    async function getTrackingDetails() {
      try{
        const trackingDetails = await axios.get("http://localhost:3006/fedex/track", {trackingNumber})
        console.log(trackingDetails.data)
      }catch(error){

      }
    }
  },[trackingNumber])
  
  return (
    <div>
      
    </div>
  );
};

export default TrackOrder;
