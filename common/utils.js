module.exports = {
    objectIdString(obj) {
        if (obj && obj._id instanceof ObjectID) {
            obj.id = obj._id.toString();
            delete obj._id;
        }
    }
}