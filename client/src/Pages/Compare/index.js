import React from "react";
import { Link } from "react-router-dom";
import Rating from "@mui/material/Rating";
import { IoIosClose } from "react-icons/io";
import Button from "@mui/material/Button";

import compare from "../../assets/images/compare.png";
import { MyContext } from "../../App";
import { useContext, useEffect, useState } from "react";
import { deleteData, fetchDataFromApi, postData } from "../../utils/api";
import { FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FaCodeCompare } from "react-icons/fa6";
import Checkbox from "@mui/material/Checkbox";

const Compare = () => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productsNames, setProductsNames] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [myCompareListData, setmyCompareListData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const context = useContext(MyContext);
  const [isLogin, setIsLogin] = useState(false);

  const history = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);

    const token = localStorage.getItem("token");
    if (token !== "" && token !== undefined && token !== null) {
      setIsLogin(true);
    } else {
      history("/signIn");
    }

    const user = JSON.parse(localStorage.getItem("user"));
    fetchDataFromApi(`/api/compare-list?userId=${user?.userId}`).then((res) => {
      setmyCompareListData(res);
    });

    context.setEnableFilterTab(false);
  }, []);

  const handleSelectProduct = (product) => {
    let updatedSelection = [...selectedProducts];
    if (updatedSelection.some((p) => p._id === product._id)) {
      updatedSelection = updatedSelection.filter((p) => p._id !== product._id);
    } else if (updatedSelection.length < 2) {
      updatedSelection.push(product);
    }
    setSelectedProducts(updatedSelection);
  };

  const removeItem = (id) => {
    setIsLoading(true);
    deleteData(`/api/compare-list/${id}`).then((res) => {
      context.setAlertBox({
        open: true,
        error: false,
        msg: "item removed from Compare List!",
      });

      const user = JSON.parse(localStorage.getItem("user"));
      fetchDataFromApi(`/api/compare-list?userId=${user?.userId}`).then(
        (res) => {
          setmyCompareListData(res);
          setIsLoading(false);
        }
      );
    });
  };

  const compareProducts = async () => {
    if (selectedProducts.length !== 2) {
      alert("Please select exactly two products to compare.");
      return;
    }
    
    setIsLoading(true);
    try {
      const product_1 = await fetchDataFromApi(
        `/api/products/${selectedProducts[0].productId}`
      );
      const product_2 = await fetchDataFromApi(
        `/api/products/${selectedProducts[1].productId}`
      );

      if (!product_1?.subCatId || !product_2?.subCatId) {
        alert("Products not valid");
      } else if (product_1?.subCatId != product_2?.subCatId) {
        alert("Cannot compare products from different subcategories.");
      } else {
        try {
          const payLoad = {
            product_1: selectedProducts[0].productId,
            product_2: selectedProducts[1].productId,
          };

          const response = await postData(`/api/products/compare`, payLoad);
          const responseProductNames = Object.keys(
            Object.values(response.specifications)[0] || {}
          );
          setComparisonResult(response);
          setProductsNames(responseProductNames);
        } catch (error) {
          console.error("Comparison API Error:", error.message);
          alert(error.message);
        }
      }
    } catch (error) {
      console.error("Comparison API Error:", error.message);
      alert(error.message);
    }

    setIsLoading(false);
  };

  return (
    <>
      <section className="section cartPage">
        <div className="container">
          <div className="myListTableWrapper">
            <h2 className="hd mb-1">Compare List</h2>
            <p>
              There are <b className="text-red">{myCompareListData?.length}</b>{" "}
              products in your Compare List
            </p>
            {myCompareListData?.length !== 0 ? (
              <div className="row">
                <div className="col-md-12 pr-5">
                  <div className="table-responsive myListTable">
                    <table className="table">
                      <thead>
                        <tr>
                          <th width="50%">Product</th>
                          <th width="15%">Unit Price</th>
                          <th width="10%">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myCompareListData?.length !== 0 &&
                          myCompareListData?.map((item, index) => {
                            return (
                              <tr>
                                <td width="50%">
                                  <Checkbox
                                    checked={selectedProducts.some(
                                      (p) => p._id === item._id
                                    )}
                                    onChange={() => handleSelectProduct(item)}
                                  />
                                  <Link to={`/product/${item?.productId}`}>
                                    <div className="d-flex align-items-center cartItemimgWrapper">
                                      <div className="imgWrapper">
                                        <img
                                          src={item?.image}
                                          className="w-100"
                                          alt={item?.productTitle}
                                        />
                                      </div>

                                      <div className="info px-3">
                                        <h6>{item?.productTitle}</h6>
                                        <Rating
                                          name="read-only"
                                          value={item?.rating}
                                          readOnly
                                          size="small"
                                        />
                                      </div>
                                    </div>
                                  </Link>
                                </td>
                                <td width="15%">Rs {item?.price}</td>

                                <td width="10%">
                                  <span
                                    className="remove"
                                    onClick={() => removeItem(item?._id)}
                                  >
                                    <IoIosClose />
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>

                    <div>
                      <h2 className="hd mb-1">Important Note</h2>
                      <p>
                        You can only compare{" "}
                        <b className="text-red">two products</b> from the{" "}
                        <b className="text-red">same category</b> at a time.
                        Products from{" "}
                        <b className="text-red">
                          different categories cannot be compared
                        </b>
                        . 🚀
                      </p>
                      <br />
                      <Button
                        className="btn-blue btn-lg btn-big btn-round bg-red"
                        onClick={compareProducts}
                      >
                        <FaCodeCompare />
                        &nbsp;&nbsp;&nbsp;Compare
                      </Button>{" "}
                      <br />
                      <br />
                      {/* {comparisonResult && ( */}
                      {comparisonResult && productsNames.length > 0 && (
                        <table className="table mt-3">
                          <thead>
                            <tr>
                              <th>Specification</th>
                              <th>{productsNames[0]}</th>
                              <th>{productsNames[1]}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(
                              comparisonResult?.specifications
                            ).map(([specName, values]) => (
                              <tr key={specName}>
                                <td>
                                  <strong>{specName}</strong>
                                </td>
                                <td>{values[productsNames[0]] || "N/A"}</td>
                                <td>{values[productsNames[1]] || "N/A"}</td>
                              </tr>
                            ))}
                            <tr key="qty">
                              <td>
                                <strong>Available Quntity</strong>
                              </td>
                              <td>
                                {comparisonResult?.product1CountInStock || 0}
                              </td>
                              <td>
                                {comparisonResult?.product2CountInStock || 0}
                              </td>
                            </tr>
                            <tr key="price">
                              <td>
                                <strong>Price</strong>
                              </td>
                              <td>
                                Rs. {comparisonResult?.product1Price || 0}
                              </td>
                              <td>
                                Rs. {comparisonResult?.product2Price || 0}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty d-flex align-items-center justify-content-center flex-column">
                <img src={compare} width="150" />
                <h3>Compare List is currently empty</h3>
                <br />
                <Link to="/">
                  {" "}
                  <Button className="btn-blue bg-red btn-lg btn-big btn-round">
                    <FaHome /> &nbsp; Continue Shopping
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {isLoading === true && <div className="loadingOverlay"></div>}
    </>
  );
};

export default Compare;
