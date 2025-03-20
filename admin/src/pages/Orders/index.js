import React, { useContext } from "react";
import { editData, fetchDataFromApi, postData } from "../../utils/api";
import { useState } from "react";
import { useEffect } from "react";

import { emphasize, styled } from "@mui/material/styles";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Chip from "@mui/material/Chip";
import HomeIcon from "@mui/icons-material/Home";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Dialog from "@mui/material/Dialog";
import { MdClose } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import Button from "@mui/material/Button";
import { FaPhoneAlt } from "react-icons/fa";
import { MdOutlineDateRange } from "react-icons/md";
import { IconButton, TextField, Typography, Box, Grid } from "@mui/material";

import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { MyContext } from "../../App";

import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";

const label = { inputProps: { "aria-label": "Checkbox demo" } };

//breadcrumb code
const StyledBreadcrumb = styled(Chip)(({ theme }) => {
  const backgroundColor =
    theme.palette.mode === "light"
      ? theme.palette.grey[100]
      : theme.palette.grey[800];
  return {
    backgroundColor,
    height: theme.spacing(3),
    color: theme.palette.text.primary,
    fontWeight: theme.typography.fontWeightRegular,
    "&:hover, &:focus": {
      backgroundColor: emphasize(backgroundColor, 0.06),
    },
    "&:active": {
      boxShadow: theme.shadows[1],
      backgroundColor: emphasize(backgroundColor, 0.12),
    },
  };
});

const columns = [
  { id: "orderId", label: "Order Id", minWidth: 150 },
  { id: "paymantId", label: "Paymant Id", minWidth: 100 },
  {
    id: "products",
    label: "Products",
    minWidth: 150,
  },
  {
    id: "name",
    label: "Name",
    minWidth: 130,
  },
  {
    id: "phoneNumber",
    label: "Phone Number",
    minWidth: 150,
  },
  {
    id: "address",
    label: "Address",
    minWidth: 200,
  },
  {
    id: "pincode",
    label: "Pincode",
    minWidth: 120,
  },
  {
    id: "totalAmount",
    label: "Total Amount",
    minWidth: 120,
  },
  {
    id: "email",
    label: "Email",
    minWidth: 120,
  },
  {
    id: "userId",
    label: "User Id",
    minWidth: 120,
  },
  {
    id: "orderStatus",
    label: "Order Status",
    minWidth: 120,
  },
  {
    id: "dateCreated",
    label: "Date Created",
    minWidth: 150,
  },
  {
    id: "trackingNumber",
    label: "Traking Number",
    minWidth: 150,
  },
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setproducts] = useState([]);
  const [shipingUnitsWeight, setShipingUnitsWeight] = useState([]);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isOpenShipModal, setIsOpenShipModal] = useState(false);
  const [isOpenTrakingModal, setIsOpenTrakingModal] = useState(false);
  const [currentItemWeight, setCurrentItemWeight] = useState("");
  const [currentOrderid, setCurrentOrderid] = useState("");
  const [formData, setFormData] = useState({
    address: {
      streetLines: ["", ""], // Two address lines
      city: "",
      stateOrProvinceCode: "",
      postalCode: "",
      countryCode: "",
      residential: false,
    },
    contact: {
      personName: "",
      emailAddress: "",
      phoneExtension: "",
      phoneNumber: "",
      companyName: "",
    },
  });
  const [trakingResponse, setTrakingResponse] = useState(null);

  const [singleOrder, setSingleOrder] = useState();
  const [statusVal, setstatusVal] = useState(null);

  const context = useContext(MyContext);
  const [isLoading, setIsLoading] = useState(false);

  const [page1, setPage1] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage1(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage1(0);
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    fetchDataFromApi(`/api/orders`).then((res) => {
      setOrders(res);
    });
  }, []);

  const showProducts = (id) => {
    fetchDataFromApi(`/api/orders/${id}`).then((res) => {
      setIsOpenModal(true);
      setproducts(res.products);
    });
  };

  const handleShipModalShow = () => {
    setIsOpenShipModal((prev) => !prev);
  };

  // const handleChangeStatus = (e, orderId) => {
  //   setstatusVal(e.target.value);
  //   setIsLoading(true);
  //   context.setProgress(40);
  //   fetchDataFromApi(`/api/orders/${orderId}`).then((res) => {
  //     const order = {
  //       name: res.name,
  //       phoneNumber: res.phoneNumber,
  //       address: res.address,
  //       pincode: res.pincode,
  //       amount: parseInt(res.amount),
  //       paymentId: res.paymentId,
  //       email: res.email,
  //       userid: res.userId,
  //       products: res.products,
  //       status: e.target.value,
  //     };

  //     console.log(e.target.value);

  //     editData(`/api/orders/${orderId}`, order).then((res) => {
  //       fetchDataFromApi(`/api/orders`).then((res) => {
  //         setOrders(res);
  //       });
  //       context.setProgress(100);
  //       setIsLoading(false);
  //     });

  //     setSingleOrder(res.products);
  //   });
  // };

  const handleProdutUpdate = (e, orderId, trackingNumber) => {
    setIsLoading(true);
    context.setProgress(40);
    fetchDataFromApi(`/api/orders/${orderId}`).then((res) => {
      const order = {
        name: res.name,
        phoneNumber: res.phoneNumber,
        address: res.address,
        pincode: res.pincode,
        amount: parseInt(res.amount),
        paymentId: res.paymentId,
        email: res.email,
        userid: res.userId,
        products: res.products,
        status: e.target.value,
        trackingNumber: trackingNumber,
      };

      console.log(e.target.value);

      editData(`/api/orders/${orderId}`, order).then((res) => {
        fetchDataFromApi(`/api/orders`).then((res) => {
          setOrders(res);
          console.log(res);
        });
        context.setProgress(100);
        setIsLoading(false);
      });

      setSingleOrder(res.products);
      setCurrentOrderid((prve) => "");
      setShipingUnitsWeight((prev) => []);
      setFormData({
        address: {
          streetLines: ["", ""],
          city: "",
          stateOrProvinceCode: "",
          postalCode: "",
          countryCode: "",
          residential: false,
        },
        contact: {
          personName: "",
          emailAddress: "",
          phoneExtension: "",
          phoneNumber: "",
          companyName: "",
        },
      });
      setIsOpenShipModal(false);
      setCurrentItemWeight((prev) => "");
    });
  };

  const handleChangeStatus = (e, orderId) => {
    setstatusVal(e.target.value);

    if (e.target.value === "confirm") {
      handleShipModalShow();
      setCurrentOrderid((prev) => orderId);
    } else {
      handleProdutUpdate(e, orderId, null);
    }
  };

  const handleShippingItemsWeight = () => {
    var newItem = {
      weight: { units: "LB", value: parseInt(currentItemWeight, 10) },
    };
    setShipingUnitsWeight((prev) => [...prev, newItem]);
    setCurrentItemWeight((prev) => "");
  };

  const removeShippingItemWeight = (index) => {
    setShipingUnitsWeight((prev) => prev.filter((_, i) => i !== index));
  };

  const handleShipSubmit = () => {
    setIsLoading(true);
    context.setProgress(40);
    const totalWeight = shipingUnitsWeight?.length
      ? shipingUnitsWeight.reduce(
          (sum, item) => sum + (item.weight?.value || 0),
          0
        )
      : 0;

    const payload = {
      requestedShipment: {
        shipper: {
          address: {
            streetLines: ["10 FedEx Parkway", "Suite 302"],
            city: "Beverly Hills",
            stateOrProvinceCode: "CA",
            postalCode: "90210",
            countryCode: "US",
            residential: false,
          },
          contact: {
            personName: "John Taylor",
            emailAddress: "sample@company.com",
            phoneExtension: "91",
            phoneNumber: "7001234567",
            companyName: "FedEx",
          },
        },
        recipients: [
          {
            address: {
              streetLines: [
                formData.address.streetLines[0],
                formData.address.streetLines[1],
              ],
              city: formData.address.city,
              stateOrProvinceCode: formData.address.stateOrProvinceCode,
              postalCode: formData.address.postalCode,
              countryCode: formData.address.countryCode,
              residential: false,
            },
            contact: {
              personName: formData.contact.personName,
              emailAddress: formData.contact.emailAddress,
              phoneExtension: formData.contact.phoneExtension,
              phoneNumber: formData.contact.phoneNumber,
              companyName: formData.contact.companyName,
            },
          },
        ],
        pickupType: "USE_SCHEDULED_PICKUP",
        serviceType: "PRIORITY_OVERNIGHT",
        packagingType: "YOUR_PACKAGING",
        totalWeight: totalWeight,
        shippingChargesPayment: {
          paymentType: "SENDER",
        },
        labelSpecification: {
          labelStockType: "PAPER_7X475",
          imageType: "PDF",
        },
        requestedPackageLineItems: shipingUnitsWeight,
      },
      labelResponseOptions: "URL_ONLY",
      accountNumber: {
        value: process.env.REACT_APP_FEDEX_ACCOUNT_ID,
      },
    };
    try {
      postData(`/api/orders/ship`, payload).then((res) => {
        context.setProgress(100);
        setIsLoading(false);

        console.log(res?.errors)

        if(res?.output?.transactionShipments[0]?.masterTrackingNumber){
          const trakinNumber =
          res.output.transactionShipments[0].masterTrackingNumber;
        if (trakinNumber) {
          const event = {
            target: {
              value: "confirm",
            },
          };
          handleProdutUpdate(event, currentOrderid, trakinNumber);
        }else{
          console.log("Error in shipping : ", res);
          alert("Error in shipping");
        }
        
        } else {
          console.log("Error in tracking number",res);
          alert("Error in tracking number");
          context.setProgress(100);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.log("Error in handling shipment response:", error);
      alert("Error in handling shipment response");
      context.setProgress(100);
      setIsLoading(false);
    }
  };

  const handleCurrentItemWeight = (e) => {
    setCurrentItemWeight(e.target.value, 10);
  };

  const handleChange = (section, field, value, index = null) => {
    setFormData((prev) => {
      const updatedData = { ...prev };

      if (index !== null) {
        updatedData[section][field][index] = value; // Handle streetLines array
      } else {
        updatedData[section][field] = value;
      }

      return updatedData;
    });
  };

  const isFormValid = () => {
    const { address, contact } = formData;
    return (
      shipingUnitsWeight.length > 0 &&
      address.streetLines.every((line) => line.trim() !== "") &&
      address.city.trim() !== "" &&
      address.stateOrProvinceCode.trim() !== "" &&
      address.postalCode.trim() !== "" &&
      address.countryCode.trim() !== "" &&
      contact.personName.trim() !== "" &&
      contact.emailAddress.trim() !== "" &&
      contact.phoneExtension.trim() !== "" &&
      contact.phoneNumber.trim() !== "" &&
      contact.companyName.trim() !== ""
    );
  };

  const handletraking = (trackingNumber) => {
    try {
      context.setProgress(40);
      setIsLoading(true);

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
        context.setProgress(100);
        setIsLoading(false);
        setTrakingResponse((prev) => res);
        console.log("Tracking response:", res);
        setIsOpenTrakingModal(true);
      });
    } catch (error) {
      console.error("Error in handling shipment response:", error);
      context.setProgress(100);
      setIsLoading(false);
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
      <div className="right-content w-100">
        <div className="card shadow border-0 w-100 flex-row p-4 align-items-center">
          <h5 className="mb-0">Orders List</h5>

          <div className="ml-auto d-flex align-items-center">
            <Breadcrumbs
              aria-label="breadcrumb"
              className="ml-auto breadcrumbs_"
            >
              <StyledBreadcrumb
                component="a"
                href="#"
                label="Dashboard"
                icon={<HomeIcon fontSize="small" />}
              />

              <StyledBreadcrumb
                label="Orders"
                deleteIcon={<ExpandMoreIcon />}
              />
            </Breadcrumbs>
          </div>
        </div>

        <div className="card shadow border-0 p-3 mt-4">
          <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        style={{ minWidth: column.minWidth }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {orders?.length !== 0 &&
                    orders
                      ?.slice(
                        page1 * rowsPerPage,
                        page1 * rowsPerPage + rowsPerPage
                      )
                      ?.reverse()
                      ?.map((order, index) => {
                        return (
                          <TableRow key={index}>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <span className="text-blue fonmt-weight-bold">
                                {order?._id}
                              </span>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <span className="text-blue fonmt-weight-bold">
                                {order?.paymentId}
                              </span>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <span
                                className="text-blue fonmt-weight-bold cursor"
                                onClick={() => showProducts(order?._id)}
                              >
                                Click here to view
                              </span>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              {order?.name}
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <FaPhoneAlt /> {order?.phoneNumber}
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              {order?.address}
                            </TableCell>
                            <TableCell>{order?.pincode}</TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              RS: {order?.amount}
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              {order?.email}
                            </TableCell>
                            <td>{order?.userid}</td>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <Select
                                disabled={isLoading === true ? true : false}
                                value={
                                  order?.status !== null
                                    ? order?.status
                                    : statusVal
                                }
                                onChange={(e) =>
                                  handleChangeStatus(e, order?._id)
                                }
                                displayEmpty
                                inputProps={{ "aria-label": "Without label" }}
                                size="small"
                                className="w-100"
                              >
                                <MenuItem value={null}>
                                  <em value={null}>None</em>
                                </MenuItem>

                                <MenuItem value="pending">Pending</MenuItem>

                                <MenuItem value="confirm">Confirm</MenuItem>

                                <MenuItem value="delivered">Delivered</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <MdOutlineDateRange />{" "}
                              {order?.date?.split("T")[0]}
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              {order?.trackingNumber ? (
                                <Typography
                                  color="primary"
                                  sx={{
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                  }}
                                  onClick={() =>
                                    handletraking(order.trackingNumber)
                                  }
                                >
                                  {order.trackingNumber}
                                </Typography>
                              ) : (
                                <Typography color="gray">Pending</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={orders?.length}
              rowsPerPage={rowsPerPage}
              page={page1}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </div>
      </div>

      <Dialog open={isOpenModal} className="productModal">
        <Button className="close_" onClick={() => setIsOpenModal(false)}>
          <MdClose />
        </Button>
        <h4 class="mb-1 font-weight-bold pr-5 mb-4">Products</h4>

        <div className="table-responsive orderTable">
          <table className="table table-striped table-bordered">
            <thead className="thead-dark">
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
                      <td>{item?.price}</td>
                      <td>{item?.subTotal}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Dialog>

      <Dialog open={isOpenShipModal} className="productModal">
        {/* <Dialog open={true} className="productModal"> */}
        <Button className="close_" onClick={() => setIsOpenShipModal(false)}>
          <MdClose />
        </Button>
        <h4 class="font-weight-bold pr-5 mb-2">Shipment Details</h4>
        {shipingUnitsWeight.length > 0 ? (
          <Typography variant="body1" mt={1} sx={{ fontWeight: "bold" }}>
            Item List
          </Typography>
        ) : null}
        <Box component="ul" pl={2}>
          {shipingUnitsWeight.map((item, index) => (
            <li
              key={index}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              Item-{index + 1} Weight - {item.weight?.value} LB
              <IconButton
                onClick={() => removeShippingItemWeight(index)}
                color="error"
                size="small"
              >
                <MdDelete />
              </IconButton>
            </li>
          ))}
        </Box>

        {/* Input & Button to Add Item */}
        <Box display="flex" gap={1} my={1}>
          <TextField
            label="Add Item"
            variant="outlined"
            size="small"
            value={currentItemWeight}
            onChange={(e) => handleCurrentItemWeight(e)}
            fullWidth
            type="number"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleShippingItemsWeight}
            disabled={!currentItemWeight ? true : false}
            disableElevation
          >
            Add
          </Button>
        </Box>

        <Typography variant="h5" sx={{ mt: 1 }}>
          Address Details
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Street Line 1"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.address.streetLines[0]}
              onChange={(e) =>
                handleChange("address", "streetLines", e.target.value, 0)
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Street Line 2"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.address.streetLines[1]}
              onChange={(e) =>
                handleChange("address", "streetLines", e.target.value, 1)
              }
            />
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="City"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.address.city}
              onChange={(e) => handleChange("address", "city", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="State/Province Code"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.address.stateOrProvinceCode}
              onChange={(e) =>
                handleChange("address", "stateOrProvinceCode", e.target.value)
              }
            />
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Postal Code"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.address.postalCode}
              onChange={(e) =>
                handleChange("address", "postalCode", e.target.value)
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Country Code"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.address.countryCode}
              onChange={(e) =>
                handleChange("address", "countryCode", e.target.value)
              }
            />
          </Grid>
        </Grid>
        <Typography variant="h5" sx={{ mt: 2 }}>
          Contact Details
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Person Name"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.contact.personName}
              onChange={(e) =>
                handleChange("contact", "personName", e.target.value)
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email Address"
              variant="outlined"
              size="small"
              fullWidth
              type="email"
              value={formData.contact.emailAddress}
              onChange={(e) =>
                handleChange("contact", "emailAddress", e.target.value)
              }
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone Extension"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.contact.phoneExtension}
              onChange={(e) =>
                handleChange("contact", "phoneExtension", e.target.value)
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone Number"
              variant="outlined"
              size="small"
              fullWidth
              value={formData.contact.phoneNumber}
              onChange={(e) =>
                handleChange("contact", "phoneNumber", e.target.value)
              }
            />
          </Grid>
        </Grid>

        <TextField
          label="Company Name"
          variant="outlined"
          size="small"
          fullWidth
          value={formData.contact.companyName}
          onChange={(e) =>
            handleChange("contact", "companyName", e.target.value)
          }
          sx={{ mt: 3, mb: 3 }}
        />

        <Button
          variant="contained"
          color="primary"
          type="submit"
          onClick={handleShipSubmit}
          disabled={!isFormValid()}
        >
          Submit
        </Button>
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