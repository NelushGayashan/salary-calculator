import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ResultItem = ({ label, value }) => (
  <div className="flex justify-between text-sm md:text-base bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
    <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
    <span className="font-bold text-gray-900 dark:text-white">${value}</span>
  </div>
);

const SalaryCalculator = () => {
  const [results, setResults] = useState({
    gross: 0,
    net: 0,
  });

  const formik = useFormik({
    initialValues: {
      CTC: '',
      EPF: '',
      ETF: '',
      Tax: '',
    },
    validationSchema: Yup.object({
      CTC: Yup.number().required("Required").positive("Must be positive"),
      EPF: Yup.number().required("Required").min(0).max(100),
      H: Yup.number().required("Required").min(0).max(100),
      Tax: Yup.number().required("Required").min(0).max(100),
    }),
    onSubmit: (values) => {
      const { CTC, EPF, ETF, Tax } = values;
      const totalDeductions = (Number(CTC) * (Number(EPF) + Number(ETF))) / 100;
      const gross = Number(CTC) - totalDeductions;
      const net = gross - (gross * Number(Tax)) / 100;

      setResults({
        gross: gross.toFixed(2),
        net: net.toFixed(2),
      });

      toast.success("Salary calculated successfully!");
    },
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col md:flex-row gap-6">

        {/* 🧾 Form Section (LEFT side on md+) */}
        <div className="md:w-1/2 w-full">
          <h1 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">
            Smart Salary Calculator
          </h1>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {["CTC", "EPF", "ETF", "Tax"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {field === "CTC" ? "Cost to Company ($)" : `${field.toUpperCase()} (%)`}
                </label>
                <input
                  type="number"
                  name={field}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values[field]}
                  className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    field === "CTC"
                      ? "e.g. 100000"
                      : field === "EPF"
                      ? "e.g. 8"
                      : field === "ETF"
                      ? "e.g. 3"
                      : "e.g. 5"
                  }
                />
                {formik.errors[field] && formik.touched[field] && (
                  <p className="text-red-500 text-xs mt-1">{formik.errors[field]}</p>
                )}
              </div>
            ))}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition duration-200"
            >
              Calculate Salary →
            </button>
          </form>
        </div>

        {/* 💬 Result Section (RIGHT side on md+) */}
        <div className="md:w-1/2 w-full">
          <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
            📊 Salary Breakdown
          </h2>
          <div className="space-y-2">
            <ResultItem label="Gross Salary" value={results.gross} />
            <ResultItem label="Net Salary" value={results.net} />
          </div>
        </div>

        <ToastContainer />
      </div>
    </div>
  );
};

export default SalaryCalculator;
