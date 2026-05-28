import React, { ChangeEvent, FC, useState, useRef } from "react";
import Card from "../Card";
import Button from "../Button";
import style from "./style.module.css";
import SearchField from "../SearchField";
import useTheme from "../../context/Theme/useTheme";
import Select from "../Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTableCells, faTableList } from "@fortawesome/free-solid-svg-icons";
import ProductRow from "../ProductRow";
import { useSelector } from "react-redux";
import { RootState } from "../../store/Reducers";
import { useCookies } from "react-cookie";
import { useReactToPrint } from "react-to-print";
import axios from "axios";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import { PrintableInvoice } from "../PrintableInvoice";
import ReceiptHistoryModal from "../ReceiptHistoryModal";
import BarcodeScanner from "../BarcodeScanner";

const ProductList: FC = () => {
  const productsReducer = useSelector<RootState>(
    (state) => state.productsReducer
  ) as Product[];
  const categories = useSelector<RootState>(
    (state) => state.categoriessReducer
  ) as Category[];
  const unitOfMeasures = useSelector<RootState>(
    (state) => state.unitOfMeasureReducer
  ) as UnitOfMeasure[];
  const theme = useTheme();
  const [searchValue, setSearcchValue] = useState("");
  const [displayWay, setDisplayWay] = useState<string>("grid");
  const [filters, setFilters] = useState({
    category: "all",
    unitOfMeasure: "all",
  });

  const [cookies] = useCookies();
  const snackbar = useSnackbar();
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [reprintInvoice, setReprintInvoice] = useState<Invoice | null>(null);
  const reprintRef = useRef<HTMLDivElement>(null);

  const triggerReprintPrint = useReactToPrint({
    content: () => reprintRef.current,
  });

  const handleReprintLast = async () => {
    const token = cookies.auth?.token;
    try {
      const res = await axios.get("http://localhost:5500/invoice", {
        headers: { Authorization: "barear " + token },
      });
      if (res.data && res.data.length > 0) {
        const latestInvoice = res.data[0];
        setReprintInvoice(latestInvoice);
        setTimeout(() => {
          triggerReprintPrint();
        }, 150);
      } else {
        snackbar.onResponse({ message: "No past transactions available to reprint.", status: 404 });
      }
    } catch (err: any) {
      snackbar.onResponse({
        message: err.response?.data?.message || "Failed to fetch latest invoice.",
        status: err.response?.status || 500,
      });
    }
  };

  // Search filters applied when the search value changed or the filtersValues changed
  let items: Product[] = [...productsReducer].filter(
    (p) =>
      (filters.category === "all"
        ? true
        : p.category.categoryName === filters.category) &&
      (filters.unitOfMeasure === "all"
        ? true
        : p.unitOfMeasure.unitOfMeasureName === filters.unitOfMeasure) &&
      (p.category.categoryName === searchValue ||
        p.title.startsWith(searchValue) ||
        (p.title + " " + p.unitOfMeasure).startsWith(searchValue) ||
        p.unitOfMeasure.unitOfMeasureName.startsWith(searchValue))
  );
  const searchHandler = (value: string) => {
    setSearcchValue(value);
  };
  const onChangeCategoryFilterHandler = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    setFilters((p) => {
      return { ...p, category: event.target.value };
    });
  };

  const onChangeUnitOfMeasureFilterHandler = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    setFilters((p) => {
      return { ...p, unitOfMeasure: event.target.value };
    });
  };

  const displayWayHandler = (status: string) => {
    setDisplayWay(status);
  };
  return (
    <div className={style.container}>
      <div className={style.head}>
        <h1 style={{ color: theme.palette.textPrimary }}>EMMARKET</h1>
        <SearchField className={style.searchBar} onChange={searchHandler} />
      </div>
      <div className={style.controls}>
        <FontAwesomeIcon
          onClick={() => displayWayHandler("grid")}
          icon={faTableCells}
          cursor={"pointer"}
          color={theme.palette.textSecondary}
          fontSize={30}
        />
        <FontAwesomeIcon
          onClick={() => displayWayHandler("list")}
          icon={faTableList}
          cursor={"pointer"}
          color={theme.palette.textSecondary}
          fontSize={30}
        />
        <Select
          onChange={onChangeCategoryFilterHandler}
          options={[{key:'all',value:'all'},...categories.map((cate) => {
            if (cate.categoryName)
              return { key: cate.categoryName, value: cate.categoryName };
            return { key: "", value: "" };
          })]}
        />
        <Select
          onChange={onChangeUnitOfMeasureFilterHandler}
          options={[{key:'all',value:'all'},...unitOfMeasures.map(p => {
            return {key:p.unitOfMeasureName, value:p.unitOfMeasureName}
          })]}
        />
        <Button onClick={() => setIsScannerOpen(true)} variant="primary" className={style.controlBtn}>
          Camera Scanner
        </Button>
        <Button onClick={() => setIsHistoryOpen(true)} variant="secondary" className={style.controlBtn}>
          Receipt History
        </Button>
        <Button onClick={handleReprintLast} variant="warning" className={style.controlBtn}>
          Reprint Last
        </Button>
      </div>
      <div className={style.productList}>
        {items.map((p) => {
          return displayWay === "grid" ? (
            <Card
              key={p.id}
              id={p.id}
              title={p.title}
              media={p.media}
              unitOfMeasure={p.unitOfMeasure.unitOfMeasureName}
              category={p.category.categoryName}
            />  
          ) : (
            <ProductRow
              key={p.id}
              id={p.id}
              price={p.price}
              title={p.title}
              media={p.media}
              unitOfMeasure={p.unitOfMeasure.unitOfMeasureName}
              category={p.category.categoryName}
            />
          );
        })}
      </div>
      <ReceiptHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <BarcodeScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
      <div style={{ display: "none" }}>
        {reprintInvoice && (
          <PrintableInvoice ref={reprintRef} invoice={reprintInvoice} />
        )}
      </div>
    </div>
  );
};

export default ProductList;
