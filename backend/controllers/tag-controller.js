const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class TagController {
    static async getTags(req, res, next) {
        const {
            page, limit, order, orderBy, search
        } = req.query;

        let skip = 0;
        if (page && page.length > 0) {
            skip = (Number(page) - 1) * limit
        }

        let orderByCondition = {};
        if (order && order.length > 0 && orderBy && orderBy.length > 0) {
            orderByCondition[orderBy] = order;
        }

        const tags = await prisma.tag.findMany({
            where: { name: { contains: search } },
            skip,
            take: limit,
            orderBy: orderByCondition
        });

        res.json(tags);
    }
    
    static async getTag(req, res, next) {
        const { tagId } = req.params;
        const tag = await prisma.tag.findUnique({
            where: { id: Number(tagId) }
        })
        if (!tag) {
            next(new Error('Wrong tag ID'));
        }
        res.json(tag);
    }
}

module.exports = TagController;