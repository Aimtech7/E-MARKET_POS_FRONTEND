import React, { FC } from "react";
import style from "./style.module.css";
import useTheme from "../../context/Theme/useTheme";
import Button from "../Button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/Reducers";
import { addProductToCart } from "../../store/Actions";
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
  const addHandler = () => {
    let isFound = products.find((p) => p.id === id);
    if (isFound) dispatch(addProductToCart(cartId, isFound));
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
