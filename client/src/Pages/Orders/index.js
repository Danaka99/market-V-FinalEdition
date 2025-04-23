import React, { useContext, useEffect, useState } from "react";
import { fetchDataFromApi, postData } from "../../utils/api";
import Pagination from "@mui/material/Pagination";
import Dialog from "@mui/material/Dialog";
import { MdClose } from "react-icons/md";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { MyContext } from "../../App";
import { Typography, Box} from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setproducts] = useState([]);
  const [page, setPage] = useState(1);

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isOpenTrakingModal, setIsOpenTrakingModal] = useState(false);
  const [trakingResponse, setTrakingResponse] = useState(null);

  const context = useContext(MyContext);

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
    fetchDataFromApi(`/api/orders?userid=${user?.userId}`).then((res) => {
      console.log(res);

      setOrders(res);
    });

    context.setEnableFilterTab(false);
  }, []);

  const showProducts = (id) => {
    fetchDataFromApi(`/api/orders/${id}`).then((res) => {
      setIsOpenModal(true);
      setproducts(res.products);
    });
  };

  const handletraking = (trackingNumber) => {
    try {
      const payload = {
        trackingInfo: [
          {
            trackingNumberInfo: {
              trackingNumber: trackingNumber,
            },
          },
        ],
        includeDetailedScans: true,
      };

      postData(`/api/orders/track`, payload).then((res) => {
        setTrakingResponse((prev) => res);
        console.log("Tracking response:", res);
        setIsOpenTrakingModal(true);
      });
    } catch (error) {
      console.error("Error in handling shipment response:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${month} ${day}, ${hours}:${minutes}`;
  };

  // Format location as "City, State"
  const formatLocation = (location) => {
    if (!location) return "";
    if (location.city && location.stateOrProvinceCode) {
      return `${location.city}, ${location.stateOrProvinceCode}`;
    } else if (location.postalCode) {
      return `Postal Code: ${location.postalCode}`;
    }
    return "";
  };

  return (
    <>
      <section className="section orderPage">
        <div className="container">
          <h2 className="hd">Orders</h2>

          <div className="table-responsive orderTable">
            <table className="table table-striped table-bordered">
              <thead className="thead-light">
                <tr>
                  <th>Order Id</th>
                  <th>Paymant Id</th>
                  <th>Products</th>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Address</th>
                  <th>Pincode</th>
                  <th>Total Amount</th>
                  <th>Email</th>
                  <th>User Id</th>
                  <th>Order Status</th>
                  <th>Date</th>
                  <th>Traking Number</th>
                </tr>
              </thead>

              <tbody>
                {orders?.length !== 0 &&
                  orders?.map((order, index) => {
                    return (
                      <>
                        <tr key={index}>
                          <td>
                            <span className="text-blue fonmt-weight-bold">
                              {order?.id}
                            </span>
                          </td>
                          <td>
                            <span className="text-blue fonmt-weight-bold">
                              {order?.paymentId}
                            </span>
                          </td>
                          <td>
                            <span
                              className="text-blue fonmt-weight-bold cursor"
                              onClick={() => showProducts(order?._id)}
                            >
                              Click here to view
                            </span>
                          </td>
                          <td>{order?.name}</td>
                          <td>{order?.phoneNumber}</td>
                          <td>{order?.address}</td>
                          <td>{order?.pincode}</td>
                          <td>LKR:{order?.amount}</td>
                          <td>{order?.email}</td>
                          <td>{order?.userid}</td>
                          <td>
                            {order?.status === "pending" ? (
                              <span className="badge badge-danger">
                                {order?.status}
                              </span>
                            ) : (
                              <span className="badge badge-success">
                                {order?.status}
                              </span>
                            )}
                          </td>
                          <td>{order?.date?.split("T")[0]}</td>
                          {order?.trackingNumber ? (
                            <td
                              style={{
                                color: "blue",
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                              onClick={() =>
                                handletraking(order.trackingNumber)
                              }
                            >
                              {order?.trackingNumber}
                            </td>
                          ) : (
                            <td>Pending</td>
                          )}
                        </tr>
                      </>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Dialog open={isOpenModal} className="productModal">
        <Button className="close_" onClick={() => setIsOpenModal(false)}>
          <MdClose />
        </Button>
        <h4 class="mb-1 font-weight-bold pr-5 mb-4">Products</h4>

        <div className="table-responsive orderTable">
          <table className="table table-striped table-bordered">
            <thead className="thead-light">
              <tr>
                <th>Product Id</th>
                <th>Product Title</th>
                <th>Image</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>SubTotal</th>
              </tr>
            </thead>

            <tbody>
              {products?.length !== 0 &&
                products?.map((item, index) => {
                  return (
                    <tr>
                      <td>{item?.productId}</td>
                      <td style={{ whiteSpace: "inherit" }}>
                        <span>{item?.productTitle?.substr(0, 30) + "..."}</span>
                      </td>
                      <td>
                        <div className="img">
                          <img src={item?.image} />
                        </div>
                      </td>
                      <td>{item?.quantity}</td>
                      <td>LKR:{item?.price}</td>
                      <td>LKR:{item?.subTotal}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Dialog>
      <Dialog open={isOpenTrakingModal} className="productModal">
        <Button className="close_" onClick={() => setIsOpenTrakingModal(false)}>
          <MdClose />
        </Button>
        <h4 class="mb-1 font-weight-bold pr-5 mb-4">Traking Details</h4>

        <Box display="flex" alignItems="center" mt={1}>
          <Typography variant="h5" >
            Tracking Number :&nbsp;
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {trakingResponse?.completeTrackResults[0]?.trackingNumber}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" mt={1}>
          <Typography variant="h5" >
            Status :&nbsp;
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {
              trakingResponse?.completeTrackResults[0]?.trackResults[0]
                ?.latestStatusDetail?.statusByLocale
            }
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" mt={1}>
          <Typography variant="h5" >
            Latest Scan Location :&nbsp;
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {
              trakingResponse?.completeTrackResults[0]?.trackResults[0]
                ?.latestStatusDetail?.scanLocation?.city
            }
            ,{" "}
            {
              trakingResponse?.completeTrackResults[0]?.trackResults[0]
                ?.latestStatusDetail?.scanLocation?.stateOrProvinceCode
            }
            ,{" "}
            {
              trakingResponse?.completeTrackResults[0]?.trackResults[0]
                ?.latestStatusDetail?.scanLocation?.countryName
            }
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" mt={1}>
          <Typography variant="h5" >
            Shipped From :&nbsp;
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {
              trakingResponse?.completeTrackResults[0]?.trackResults[0]
                ?.originLocation?.locationContactAndAddress?.address?.city
            }
            ,{" "}
            {
              trakingResponse?.completeTrackResults[0]?.trackResults[0]
                ?.originLocation?.locationContactAndAddress?.address
                ?.stateOrProvinceCode
            }
            ,{" "}
            {
              trakingResponse?.completeTrackResults[0]?.trackResults[0]
                ?.originLocation?.locationContactAndAddress?.address
                ?.countryName
            }
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" mt={1}>
          <Typography variant="h5" >
            Shipped To :&nbsp;
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {
              trakingResponse?.completeTrackResults[0]?.trackResults[0]
                ?.recipientInformation?.address?.city
            }
            ,{" "}
            {
              trakingResponse?.completeTrackResults[0]?.trackResults[0]
                ?.recipientInformation?.address?.stateOrProvinceCode
            }
            ,{" "}
            {
              trakingResponse?.completeTrackResults[0]?.trackResults[0]
                ?.recipientInformation?.address?.countryName
            }
          </Typography>
        </Box>
        {trakingResponse?.completeTrackResults[0]?.trackResults[0]?.scanEvents
          .length > 0 ? (
          <Box sx={{ width: "100%", mt: 2 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: "white",
                backgroundColor: "#333",
                p: 1,
              }}
            >
              Tracking History
            </Typography>

            {/* <TableContainer component={Paper}> */}
            <Table aria-label="tracking history table">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 800 }}>
                    Date & Time (Local)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trakingResponse?.completeTrackResults[0]?.trackResults[0]?.scanEvents
                  .slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((event, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        "&:nth-of-type(odd)": {
                          backgroundColor: "#fafafa",
                        },
                      }}
                    >
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ color: "#0073e6", fontWeight: 500 }}
                      >
                        {formatDate(event.date)}
                      </TableCell>
                      <TableCell>{event.eventDescription}</TableCell>
                      <TableCell>
                        {formatLocation(event.scanLocation)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            {/* </TableContainer> */}
          </Box>
        ) : null}
      </Dialog>
    </>
  );
};

export default Orders;
