import React from "react";
import {
  FaUserAlt,
  FaCalendarAlt,
  FaEdit,
  FaBriefcase,
  FaChartBar,
  FaDatabase,
  FaIdCard,
  FaBarcode,
  FaPrint
} from "react-icons/fa";
import { CiCalendarDate } from "react-icons/ci";
import { CgProfile } from "react-icons/cg";
import { RxDashboard } from "react-icons/rx";
import { IoShareSocialSharp, IoBanOutline } from "react-icons/io5";
import {
  FaLinkedin,
  FaUserPlus,
  FaMailBulk,
  FaGithub,
  FaUserCircle,
  FaRegEdit,
} from "react-icons/fa";
import { GiCheckMark } from "react-icons/gi";
import { HiArrowLongRight } from "react-icons/hi2";

const getIcon = (type, props) => {
  switch (type) {
    case "user":
      return <FaUserAlt {...props} />;
    case "calendar":
      return <FaCalendarAlt {...props} />;
    case "edit":
      return <FaEdit {...props} />;
    case "work":
      return <FaBriefcase {...props} />;
    case "chart":
      return <FaChartBar {...props} />;
    case "database":
      return <FaDatabase {...props} />;
    case "id":
      return <FaIdCard {...props} />;
    case "barcode":
      return <FaBarcode {...props} />;
    case "print":
      return <FaPrint {...props} />;
    case "leave":
      return <CiCalendarDate className="mb-1 me-1" />;
    case "profile":
      return <CgProfile className="mb-1 me-1" />;
    case "dashboard":
      return <RxDashboard className="mb-1 me-1" />;
    case "email":
      return <FaMailBulk className="mb-1 me-2" />;
    case "linkedIn":
      return <FaLinkedin className="mb-1 me-2" />;
    case "joiningDate":
      return <FaUserPlus className="mb-1 me-2" />;
    case "githubId":
      return <FaGithub className="mb-1 me-2" />;
    case "share":
      return <IoShareSocialSharp className="mb-1 me-3" />;
    case "check":
      return <GiCheckMark className="mb-1 me-3" />;
    case "reject":
      return <IoBanOutline className="mb-1 me-3" />;
    case "right-arrow":
      return <HiArrowLongRight className="mb-1 me-3" />;
    case "user":
      return <FaUserCircle className="mb-1 me-3" />;
    case "edit":
      return <FaRegEdit className="mb-1 me-2" />;
    default:
      return null;
  }
};

export default getIcon;
