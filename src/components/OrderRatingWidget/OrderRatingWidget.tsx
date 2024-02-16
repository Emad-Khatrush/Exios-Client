import { useParams } from "react-router-dom";
import api from "../../api";
import Card from "../Card/Card";
import RatingStars from "../RatingStars/RatingStars";
import { useState } from "react";
import AlertInfo from "../AlertInfo/AlertInfo";

const defaultFields = [
  {
    name: 'employeeQuestion',
    label: 'كيف كانت تعامل الموظفين معك؟',
    type: 'rating'
  },
  {
    name: 'generalQuestion',
    label: 'ماهو رايك بالخدمات التي تحصلت عليها بشكل عام؟',
    type: 'rating'
  },
  {
    name: 'reviewQuestion',
    label: 'اعطنى رايك على الخدمات التي تحصلت عليها',
    type: 'text'
  }
]

const OrderRatingWidget = () => {
  let { id: orderId } = useParams();

  const [fields, setFields] = useState(defaultFields);
  const [alert, setAlert] = useState<{ message: string, tint: 'info' | 'danger' | 'success' | 'warning' } | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const createRating = async () => {
    try {
      let hasError = false;
      fields.forEach((field: any) => {
        if (!field.value) {
          setAlert({
            message: "يرجى تعبية جميع الخانات قبل ارسال",
            tint: 'danger'
          });
          hasError = true;
        }
      })
      if (hasError) return;
      setAlert(undefined);
      setIsLoading(true);
      await api.createRatingForOrder(orderId, {questions: fields});
      setAlert({
        message: 'تم ارسال تقييمكم بنجاح، شكرا لكم',
        tint: 'success'
      });
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  }

  return (
    <Card
      className="rounded-2xl mb-5 text-end"
    >
      {alert && 
        <AlertInfo
          tint={alert.tint}
          description={alert.message}
        />
      }

      <p className="mb-4 mt-3">
        شكرا لتعاملك مع شركة اكسيوس، لان رايك يهمنا اعطنى رأيك في الخدمات التي تلقيتها 
      </p>

      {fields.map(field => (
        <div className="flex justify-end items-end flex-col mb-8">
          <label className=" font-bold mb-3"> {field.label} </label>
          {field.type === 'text' ?
            <textarea
              className="mt-2"
              name={field.name}
              cols={20} 
              rows={2}
              onChange={(event) => {
                const foundField = fields.find(question => question.name === event.target.name) as any;
                foundField.value = event.target.value;
                setFields(fields);
              }}
              disabled={isLoading}
            />
            :
            <RatingStars
              name={field.name}
              onChange={(value, event) => {
                const foundField = fields.find(question => question.name === event.target.name) as any;
                foundField.value = value;
                setFields(fields);
              }}
              disbaled={isLoading}
            />
          }
        </div>
      ))}

      <button
        className="disabled:bg-slate-400 disabled:text-white-500 group my-1 relative py-2 px-4 mt-2 border border-transparent w-52 md:w-fit text-xs md:text-sm font-bold rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        onClick={createRating}
        disabled={isLoading}
      >
        ارسل تقييمك
      </button>
    </Card>
  )
}

export default OrderRatingWidget;
