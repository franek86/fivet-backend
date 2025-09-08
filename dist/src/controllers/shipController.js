"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShip = exports.updateShip = exports.getShip = exports.getDashboardShips = exports.updatePublishedShip = exports.getAllPublishedShips = exports.createShip = void 0;
const pagination_1 = require("../helpers/pagination");
const cloudinaryConfig_1 = require("../cloudinaryConfig");
const shipSchema_1 = require("../schemas/shipSchema");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const shipFilters_1 = require("../helpers/shipFilters");
const parseSortBy_1 = require("../helpers/parseSortBy");
const errorHandler_1 = require("../helpers/errorHandler");
/*
CREATE SHIP
Authenticate user can create ship
*/
const createShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const body = shipSchema_1.shipSchema.parse(req.body);
    const files = req.files;
    let mainImageUrl = "";
    let imagesUrls = [];
    try {
        if ((_b = (_a = files === null || files === void 0 ? void 0 : files["mainImage"]) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.path) {
            mainImageUrl = yield (0, cloudinaryConfig_1.uploadSingleFile)(files["mainImage"][0].path, "ship/mainImage");
        }
        if (files === null || files === void 0 ? void 0 : files["images"]) {
            imagesUrls = yield (0, cloudinaryConfig_1.uploadMultipleFiles)(files["images"], "ship/images");
        }
        const shipData = Object.assign(Object.assign({}, body), { mainImage: mainImageUrl, images: imagesUrls, isPublished: false });
        const createdShip = yield prismaClient_1.default.ship.create({ data: shipData });
        return res.status(200).json({
            message: "Ship added successfully! Awaiting admin approval.",
            data: createdShip,
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.createShip = createShip;
/*
GET PUBLISHED SHIPS
It is public route. Get all published ships with pagination, sort, filters
TO DO: add filters
*/
const getAllPublishedShips = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pageNumber, pageSize, skip } = (0, pagination_1.getPaginationParams)(req.query);
        const filters = (0, shipFilters_1.shipFilters)(req.query);
        const { sortBy } = req.query;
        const orderBy = (0, parseSortBy_1.parseSortBy)(sortBy, ["shipName", "price", "createdAt"], { createdAt: "desc" });
        const where = Object.assign({ isPublished: true }, filters);
        const [ships, totalShips] = yield Promise.all([
            prismaClient_1.default.ship.findMany({
                skip,
                take: pageSize,
                where,
                orderBy,
            }),
            prismaClient_1.default.ship.count({ where }),
        ]);
        /*  const ships = await prisma.ship.findMany({
          skip,
          take: pageSize,
          where: { ...filters, isPublished: true },
          orderBy: { createdAt: "desc" },
        });
    
        const totalShips = await prisma.ship.count({
          where: {
            isPublished: true,
            ...filters,
          },
        }); */
        return res.status(200).json({
            page: pageNumber,
            limit: pageSize,
            totalShips,
            totalPages: Math.ceil(totalShips / pageSize),
            data: ships,
        });
    }
    catch (error) { }
});
exports.getAllPublishedShips = getAllPublishedShips;
/*
PUBLISH SHIPS ADMIN ONLY
*/
const updatePublishedShip = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { isPublished } = req.body;
    if (!id)
        throw new errorHandler_1.ValidationError("Ship id not found");
    try {
        const updateShip = yield prismaClient_1.default.ship.update({ where: { id }, data: { isPublished } });
        return res.status(200).json(updateShip);
    }
    catch (error) {
        next(error);
    }
});
exports.updatePublishedShip = updatePublishedShip;
/*
GET ALL SHIPS
Get all ships from admin published or not published. Users can see only their own ships
TO DO: filter by status
*/
const getDashboardShips = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, role } = req.user;
    const { pageNumber, pageSize, skip } = (0, pagination_1.getPaginationParams)(req.query);
    const filters = (0, shipFilters_1.shipFilters)(req.query);
    const { sortBy, search } = req.query;
    try {
        let ships;
        const whereCondition = Object.assign({}, filters);
        if (search && typeof search === "string" && search.trim().length > 0) {
            whereCondition.OR = [{ shipName: { contains: search.trim(), mode: "insensitive" } }];
        }
        if (role !== "ADMIN") {
            whereCondition.userId = userId;
        }
        // Sort handling
        const orderBy = (0, parseSortBy_1.parseSortBy)(sortBy, ["shipName", "price", "createdAt"], { createdAt: "desc" });
        const totalShipsType = (ships = yield prismaClient_1.default.ship.count());
        ships = yield prismaClient_1.default.ship.findMany({
            skip,
            take: pageSize,
            where: whereCondition,
            orderBy,
            include: {
                user: {
                    select: {
                        profile: {
                            select: {
                                fullName: true,
                            },
                        },
                    },
                },
                shipType: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        return res.status(200).json({
            message: "Ships fetched successfully.",
            page: pageNumber,
            limit: pageSize,
            totalShipsType,
            totalPages: Math.ceil(totalShipsType / pageSize),
            data: ships,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error fetching dashboard data." });
    }
});
exports.getDashboardShips = getDashboardShips;
/* GET SINGLE SHIP BY ID */
const getShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        return res.status(404).json({ message: "Ship id are not found!" });
    try {
        const ship = yield prismaClient_1.default.ship.findUnique({
            where: { id },
            include: {
                shipType: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        if (!ship) {
            return res.status(404).json({ message: "Ship not found" });
        }
        return res.status(200).json(ship);
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.getShip = getShip;
/*
UPDATE SHIPS BY ID
Admin can update all ship, but users can only update their own ships
*/
const updateShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { id } = req.params;
    /*  const {
      shipName,
      typeId,
      imo,
      refitYear,
      buildYear,
      isPublished,
      price,
      location,
      mainEngine,
      lengthOverall,
      beam,
      length,
      depth,
      draft,
      tonnage,
      cargoCapacity,
      buildCountry,
      remarks,
      description,
      mainImage,
      images,
    } = req.body; */
    try {
        const ship = yield prismaClient_1.default.ship.findUnique({ where: { id } });
        if (!ship) {
            return res.status(404).json({ message: "Ship not found" });
        }
        // ✅ Validate body
        const parsed = shipSchema_1.shipSchema.parse(req.body);
        const files = req.files;
        // Handle new files from Multer
        const newImages = ((_a = files === null || files === void 0 ? void 0 : files.images) === null || _a === void 0 ? void 0 : _a.map((file) => file.path)) || [];
        const uploadedMainImage = ((_c = (_b = files === null || files === void 0 ? void 0 : files.mainImage) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.path) || ship.mainImage;
        // Filter out any blob URLs
        const oldImages = Array.isArray(req.body.images) ? req.body.images.filter((img) => !img.startsWith("blob:")) : [];
        const updatedShip = yield prismaClient_1.default.ship.update({
            where: { id },
            data: Object.assign(Object.assign({}, parsed), { mainImage: uploadedMainImage, images: [...oldImages, ...newImages] }),
            /* data: {
              shipName,
              typeId,
              isPublished,
              imo,
              buildYear: buildYear ? parseInt(buildYear, 10) : null,
              refitYear: refitYear ? parseInt(refitYear, 10) : null,
              price: parseFloat(price),
              beam: parseFloat(beam),
              location,
              mainEngine,
              lengthOverall,
              length: parseFloat(length),
              depth: parseFloat(depth),
              draft: parseFloat(draft),
              tonnage: parseFloat(tonnage),
              cargoCapacity,
              buildCountry,
              remarks,
              description,
              mainImage: uploadedMainImage,
              images: [...oldImages, ...newImages],
            }, */
        });
        return res.status(200).json({
            message: "Ship updated successfully",
            data: updatedShip,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateShip = updateShip;
/*
DELETE SHIP BY ID
Admin can delete all ship, but users can only delete their own ships
*/
const deleteShip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const ship = yield prismaClient_1.default.ship.findUnique({ where: { id } });
        if (!ship) {
            return res.status(404).json({ message: "Ship not found" });
        }
        yield prismaClient_1.default.ship.delete({
            where: { id },
        });
        return res.status(200).json({
            message: "Ship deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteShip = deleteShip;
