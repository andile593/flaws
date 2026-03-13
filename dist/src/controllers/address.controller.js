import prisma from '../lib/prisma';
export const addAddress = async (req, res) => {
    const userId = req.user.id;
    const { fullName, street, city, province, postalCode, country } = req.body;
    const address = await prisma.address.create({
        data: { userId, fullName, street, city, province, postalCode, country },
    });
    res.status(201).json(address);
};
export const getUserAddresses = async (req, res) => {
    const userId = req.user.id;
    const addresses = await prisma.address.findMany({ where: { userId } });
    res.json(addresses);
};
