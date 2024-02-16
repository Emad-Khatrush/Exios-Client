import { BiInfoCircle } from 'react-icons/bi';
import { FaShippingFast } from 'react-icons/fa';
import { RiShipLine } from 'react-icons/ri';
import { useState } from 'react';
import Card from '../../components/Card/Card';
import CustomStepper from '../../components/CustomStepper/CustomStepper';
import ShipFromTo from './ShipFromTo';
import ShipToPage from './ShipToPage';
import ShipmentGuide from './ShipmentGuide';

const StartShipmentPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [shipmentFrom, setShipmentFrom] = useState<string | null>(null);
  const [shipmentTo, setShipmentTo] = useState<string | null>(null);
  const [shipmentMethod, setShipmentMethod] = useState<string | null>(null);

  const goNextStep = () => {    
    setActiveStep((prev: number) => {
      if (steps.length - 1 <= prev) {
        return prev;
      }
      return prev + 1;
    })
  }

  const renderCurrentStepComponent = () => {
    switch (activeStep) {
      case 0:
        return <ShipFromTo 
                 shipFromChange={(value: string) => setShipmentFrom(value)}
                 shipToChange={(value: string) => setShipmentTo(value)}
               />
      
      case 1:
        return <ShipToPage 
                 onCardClick={(value: string) => {
                  setShipmentMethod(value);
                  goNextStep();
                 }}
               />
  
      case 2:
        if (!shipmentMethod || !shipmentFrom || !shipmentTo) {
          return;
        }
        return <ShipmentGuide 
                 data={{
                  shipmentMethod,
                  shipmentFrom,
                  shipmentTo
                 }}
                />
    
      default:
        return <div></div>;
    }
  }

  const currentStepComponent = renderCurrentStepComponent();
  const steps = generateSteps();

  return (
    <div className="container mx-auto py-10 h-64 w-11/12 px-6">
      <Card>
        <CustomStepper 
          acriveStep={activeStep}
          steps={steps}
        />

        {currentStepComponent}

        <div className='text-right'>
          {activeStep !== 0 &&
            <button
              type="submit"
              className="mr-5 py-2 px-4 text-lg font-medium text-sky-600"
              onClick={() => {       
                // get active step becuase it is go back
                if ((activeStep - 1) === 0) {
                  setShipmentFrom(null);
                  setShipmentTo(null);
                }
                setActiveStep((prev) => prev - 1);
              }}
            >
              تراجع
            </button>
          }
          {activeStep !== 2 &&
            <button
              type="submit"
              disabled={!shipmentFrom || !shipmentTo}
              className="disabled:bg-slate-400 disabled:text-white-500 mr-5 group relative py-2 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={goNextStep}
            >
              التالي
            </button>
          }
        </div>
      </Card>
    </div>
  );
}

const generateSteps = () => {
  const steps = [
    {
      label: 'الشحن من اين الى اين',
      stepIcon: FaShippingFast
    },
    {
      label: 'طريقة الشحن',
      stepIcon: RiShipLine
    },
    {
      label: 'تعليمات',
      stepIcon: BiInfoCircle
    }
  ]
  return steps;
}

export default StartShipmentPage;
