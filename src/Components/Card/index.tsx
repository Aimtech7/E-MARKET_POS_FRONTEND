import React, { FC } from "react";
import style from "./style.module.css";
import useTheme from "../../context/Theme/useTheme";
import Button from "../Button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/Reducers";
import { addProductToCart, createCart, chooseCart } from "../../store/Actions";
import useSnackbar from "../../context/Snackbar/useSnackbar";
interface props {
  title: string;
  unitOfMeasure: string;
  category: string;
  media: string;
  id: string;
  className?: string;
}
const Card: FC<props> = ({
  title,
  unitOfMeasure,
  category,
  media,
  id,
  className = "",
}) => {
  const theme = useTheme();
  const cartId = useSelector<RootState>(
    (state) => state.selectedCartReducer
  ) as string;
  const products = useSelector<RootState>(
    (state) => state.productsReducer
  ) as Product[];

  const dispatch = useDispatch();
  const snackbar = useSnackbar();

  const addHandler = () => {
    let isFound = products.find((p) => p.id === id);
    if (isFound) {
      let targetCartId = cartId;
      if (!targetCartId) {
        targetCartId = Date.now().toString();
        dispatch(createCart(targetCartId));
        dispatch(chooseCart(targetCartId));
      }
      dispatch(addProductToCart(targetCartId, isFound));
      snackbar.onResponse({ message: "Product added to cart", status: 200 });
    }
  };

  return (
    <div className={`${style.card} ${className}`}>
      <div className={style.cardMedia}>
        <img src={media} alt={title} />
        <Button
          variant="primary"
          onClick={addHandler}
          className={style.buttonAdd}
        >
          Add to Cart
        </Button>
      </div>
      <div className={style.cardBody}>
        <div className={style.title}>
          <p className={style.titleName}>{title}</p>
          <p className={style.titleUnit}>{unitOfMeasure}</p>
        </div>
        <div className={style.category}>
          <p className={style.categoryLabel}>Category</p>
          <span className={style.categoryCeil}>
            {category}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Card;
