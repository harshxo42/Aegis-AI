/**
 * Aegis AI – Emergency SOS Page
 *
 * Improved Emergency Request Flow
 * Supports hospital selection + ambulance dispatch
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { emergenciesAPI } from '@/api/client';

import Map from '@/components/maps/Map';
import { userLocationIcon } from '@/components/maps/MapIcons';

import { Marker, Popup } from 'react-leaflet';

import {
  AlertTriangle,
  Phone,
  ShieldAlert,
  HeartPulse,
  Activity,
  ChevronRight,
  Ambulance,
  MapPin,
} from 'lucide-react';

import type { EmergencyType } from '@/types';



const emergencyTypes: {
  value: EmergencyType;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [

{
  value:'cardiac',
  label:'Cardiac / Heart',
  icon:<HeartPulse size={24}/>,
  color:'#ef4444'
},

{
  value:'trauma',
  label:'Trauma / Accident',
  icon:<Activity size={24}/>,
  color:'#f97316'
},

{
  value:'stroke',
  label:'Stroke',
  icon:<AlertTriangle size={24}/>,
  color:'#8b5cf6'
},

{
  value:'breathing',
  label:'Breathing Difficulty',
  icon:<Activity size={24}/>,
  color:'#06b6d4'
},

{
  value:'other',
  label:'Other Emergency',
  icon:<ShieldAlert size={24}/>,
  color:'#64748b'
}

];


type LocationStatus =
'idle'
| 'fetching'
| 'success'
| 'error';



export default function EmergencySOSPage(){


const navigate = useNavigate();

const routerLocation = useLocation();



const selectedHospital =
routerLocation.state as {
  hospitalId?: string;
  hospitalName?: string;
  hospitalAddress?: string;
} | null;



const [step,setStep] = useState(1);

const [loading,setLoading] =
useState(false);



const [formData,setFormData] =
useState({

hospital_id:
selectedHospital?.hospitalId || '',


emergency_type:
'other' as EmergencyType,


severity:4,


description:'',


symptoms:'',


location_lat:28.6139,


location_lng:77.209,


location_address:
selectedHospital?.hospitalAddress || ''

});



const [locationStatus,setLocationStatus] =
useState<LocationStatus>('idle');





// -------------------------------
// Auto Detect Location
// -------------------------------

useEffect(() => {
  if (!navigator.geolocation) {
    setLocationStatus('error');
    return;
  }

  setLocationStatus('fetching');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      setFormData((prev) => ({
        ...prev,
        location_lat: position.coords.latitude,
        location_lng: position.coords.longitude,
      }));
      setLocationStatus('success');
    },
    (err) => {
      console.warn('[Aegis AI] Geolocation access unavailable/denied:', err);
      setLocationStatus('error');
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}, []);





// -------------------------------
// Map Selection
// -------------------------------


const handleLocationSelect =
(lat:number,lng:number)=>{


setFormData(prev=>({

...prev,


location_lat:lat,


location_lng:lng


}));


setLocationStatus('success');


};





// -------------------------------
// Emergency Submit
// -------------------------------


const handleSubmit =
async(e:React.FormEvent)=>{


e.preventDefault();


if(loading)return;



try{


setLoading(true);



const response =
await emergenciesAPI.create({

hospital_id:
formData.hospital_id || undefined,


emergency_type:
formData.emergency_type,


severity:
formData.severity,


description:
formData.description.trim(),


symptoms:
formData.symptoms.trim(),


location_lat:
formData.location_lat,


location_lng:
formData.location_lng,


location_address:
formData.location_address.trim()


});



toast.success(
response.data?.message ||
'Emergency request created'
);



navigate(
'/emergencies',
{
replace:true
}
);



}
catch(error:any){


console.error(
'Emergency error:',
error
);


toast.error(

error?.response?.data?.message ||

'Failed to create emergency'

);


}
finally{


setLoading(false);


}


};
  return (

    <div className="max-w-4xl mx-auto space-y-6">


      {/* HEADER */}

      <div className="text-center mb-8">

        <motion.div

          animate={{
            scale:[1,1.1,1]
          }}

          transition={{
            duration:2,
            repeat:Infinity
          }}

          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"

          style={{
            background:'rgba(239,68,68,0.1)',
            border:'2px solid rgba(239,68,68,0.3)'
          }}

        >

          <Phone
            size={36}
            style={{
              color:'var(--danger-500)'
            }}
          />

        </motion.div>



        <h1 className="text-3xl font-bold text-white mb-2">

          Emergency SOS

        </h1>


        <p className="text-gray-400">

          Request immediate medical assistance

        </p>


      </div>





      {/* CARD */}

      <div className="glass-card">


        {/* STEPS */}

        <div className="flex bg-[var(--bg-tertiary)] rounded-t-xl overflow-hidden">


          <div

          className={`
          flex-1 py-3 text-center text-sm font-medium
          ${
          step===1
          ?
          'bg-[var(--danger-500)] text-white'
          :
          'text-gray-400'
          }
          `}

          >

          1. Emergency Type

          </div>



          <div

          className={`
          flex-1 py-3 text-center text-sm font-medium
          ${
          step===2
          ?
          'bg-[var(--danger-500)] text-white'
          :
          'text-gray-400'
          }
          `}

          >

          2. Location & Details

          </div>


        </div>





        <div className="p-6">


        <AnimatePresence mode="wait">


        {
        step===1
        ?

        (

        <motion.div

        key="step1"

        initial={{
          opacity:0,
          x:-20
        }}

        animate={{
          opacity:1,
          x:0
        }}

        exit={{
          opacity:0,
          x:20
        }}

        className="space-y-6"

        >



        <h2 className="text-xl font-semibold text-center">

        Select Emergency Type

        </h2>





        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">


        {
        emergencyTypes.map(type=>(


        <motion.button


        key={type.value}

        type="button"


        whileHover={{
          scale:1.03
        }}


        whileTap={{
          scale:0.97
        }}



        onClick={()=>


        setFormData(prev=>({

          ...prev,

          emergency_type:type.value

        }))


        }



        className="p-4 rounded-xl border flex flex-col items-center gap-3"


        style={{


        borderColor:

        formData.emergency_type===type.value

        ?

        type.color

        :

        'var(--border-color)',



        background:

        formData.emergency_type===type.value

        ?

        `${type.color}20`

        :

        'var(--bg-tertiary)'


        }}


        >


        <div style={{
          color:type.color
        }}>

        {type.icon}

        </div>



        <span className="text-sm font-medium">

        {type.label}

        </span>



        </motion.button>


        ))

        }


        </div>





        {/* SEVERITY */}


        <div className="pt-6 border-t border-[var(--border-color)]">


        <label className="block mb-3 text-sm text-gray-300">

        Severity:
        {' '}
        {formData.severity}/5


        </label>



        <input


        type="range"

        min="1"

        max="5"

        value={formData.severity}


        onChange={(e)=>


        setFormData(prev=>({

        ...prev,

        severity:Number(e.target.value)

        }))


        }


        className="w-full accent-red-500"


        />


        </div>





        <div className="flex justify-end">


        <motion.button


        type="button"


        onClick={()=>setStep(2)}


        className="px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2"


        style={{

        background:
        'linear-gradient(135deg,var(--danger-600),var(--danger-500))'

        }}


        >


        Next

        <ChevronRight size={18}/>


        </motion.button>


        </div>




        </motion.div>


        )

        :

        (        <motion.div

        key="step2"

        initial={{
          opacity:0,
          x:-20
        }}

        animate={{
          opacity:1,
          x:0
        }}

        exit={{
          opacity:0,
          x:20
        }}

        className="space-y-6"

        >



        <form
        onSubmit={handleSubmit}
        className="space-y-6"
        >




        {/* LOCATION */}


        {/* LOCATION */}
        <div>
          <label className="flex justify-between items-center text-sm text-gray-300 mb-2">
            <span className="flex items-center gap-2 font-medium">
              <MapPin size={16} className="text-rose-400" />
              Emergency Location
            </span>

            <span className="text-xs text-gray-400">
              {locationStatus === "fetching"
                ? "Detecting..."
                : locationStatus === "success"
                ? "Location Ready"
                : "Manual Selection"}
            </span>
          </label>

          {locationStatus === "error" && (
            <div
              className="mb-3 p-3 rounded-lg flex items-start gap-2.5 text-xs"
              style={{
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                color: "var(--warning-400)",
              }}
            >
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              <span>
                Location access is unavailable. Default coordinates (New Delhi: 28.6139, 77.2090) are selected. You can click on the map to choose your exact location manually.
              </span>
            </div>
          )}

          <div className="border border-[var(--border-color)] rounded-xl overflow-hidden shadow-md">
            <Map
              center={[formData.location_lat, formData.location_lng]}
              zoom={14}
              height="320px"
              onLocationSelect={handleLocationSelect}
            >
              <Marker
                position={[formData.location_lat, formData.location_lng]}
                icon={userLocationIcon}
              >
                <Popup>Emergency Location ({formData.location_lat.toFixed(4)}, {formData.location_lng.toFixed(4)})</Popup>
              </Marker>
            </Map>
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500">
            <span>
              Coordinates: {formData.location_lat.toFixed(4)}, {formData.location_lng.toFixed(4)}
            </span>
            <span>Click map to reposition pin</span>
          </div>
        </div>






        {/* HOSPITAL INFO */}


        {
        selectedHospital?.hospitalName &&


        <div

        className="p-4 rounded-xl"

        style={{

        background:
        'rgba(16,185,129,0.1)',

        border:
        '1px solid rgba(16,185,129,0.3)'

        }}

        >


        <p className="text-sm text-emerald-400 font-semibold">


        Preferred Hospital


        </p>


        <p className="text-white font-medium">


        {selectedHospital.hospitalName}


        </p>


        </div>


        }






        {/* DESCRIPTION */}


        <div>


        <label className="block text-sm text-gray-300 mb-2">


        Emergency Details


        </label>



        <textarea


        value={formData.description}


        onChange={(e)=>

        setFormData(prev=>({

        ...prev,

        description:e.target.value

        }))

        }


        placeholder="Patient condition, address details, symptoms..."


        className="w-full min-h-[120px] p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-white resize-none"


        />



        </div>






        {/* SYMPTOMS */}


        <div>


        <label className="block text-sm text-gray-300 mb-2">


        Symptoms


        </label>



        <textarea


        value={formData.symptoms}


        onChange={(e)=>

        setFormData(prev=>({

        ...prev,

        symptoms:e.target.value

        }))

        }


        placeholder="Chest pain, bleeding, unconsciousness..."


        className="w-full min-h-[90px] p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-white resize-none"


        />


        </div>






        {/* BUTTONS */}


        <div className="flex gap-4 pt-5 border-t border-[var(--border-color)]">


        <button


        type="button"


        onClick={()=>setStep(1)}


        disabled={loading}


        className="px-6 py-3 rounded-xl"


        style={{


        background:
        'var(--bg-tertiary)',


        border:
        '1px solid var(--border-color)'


        }}


        >


        Back


        </button>





        <motion.button


        type="submit"


        disabled={loading}


        whileTap={{
          scale:0.97
        }}


        className="flex-1 py-3 rounded-xl text-white font-bold flex justify-center items-center gap-2"


        style={{


        background:
        'linear-gradient(135deg,var(--danger-600),var(--danger-500))'


        }}



        >


        {
        loading

        ?

        "DISPATCHING..."

        :

        <>

        <Ambulance size={20}/>

        DISPATCH AMBULANCE


        </>

        }



        </motion.button>



        </div>



        </form>


        </motion.div>

        )


        }


        </AnimatePresence>


        </div>


      </div>

      {/* WARNING NOTICE */}

      <div

      className="p-4 rounded-xl flex items-start gap-3 text-sm mt-8"

      style={{

      background:
      'rgba(245,158,11,0.1)',


      border:
      '1px solid rgba(245,158,11,0.2)'

      }}

      >


      <ShieldAlert

      size={20}

      style={{

      color:
      'var(--warning-500)',

      flexShrink:0

      }}

      />



      <p

      style={{

      color:
      'var(--text-secondary)'

      }}

      >


      <strong

      style={{

      color:
      'var(--warning-400)'

      }}

      >

      Warning:

      </strong>


      {' '}

      False emergency requests are punishable.
      Use SOS only for genuine medical emergencies.


      </p>


      </div>





    </div>

  );


}