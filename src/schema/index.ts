import * as yup from "yup";

export const schema = yup.object().shape({
  category: yup.string(),
});
export const unitOfMeasureSchema = yup.object().shape({
  unitOfMeasureName: yup.string().required("Name is required field"),
  baseOfUnitOfMeasure: yup
    .string()
    .required("Base Unit of measure is required field"),
  CFB: yup.number().required("Conversion Factor base is required field"),
});

export const unitOfMeasureUpdateSchema = yup.object().shape({
  unitOfMeasureName: yup.string().required("Name is required field"),
  baseOfUnitOfMeasure: yup
    .string()
    .required("Base Unit of measure is required field"),
  CFB: yup.number().required("Conversion Factor base is required field"),
});

export const productShcema = yup.object().shape({
  title: yup.string().required("Title of product is required").min(4),
  category: yup.string().required("This Field is required"),
  price: yup.number().required("This Field is required"),
  unit: yup.string().required("This Field is required"),
  sku: yup.string(),
  barcode: yup.string(),
  reorderLevel: yup.number().min(0, "Reorder level must be 0 or greater"),
  costPrice: yup.number().min(0),
  sellingPrice: yup.number().min(0),
  profitMargin: yup.number(),
});

export const userSchema = yup.object().shape({
  username: yup.string().required("Username is required"),
  password: yup.string().required("Password is required"),
});

export const testSchema = yup.object().shape({
  testField: yup.string().required("TEST ERROR"),
});
