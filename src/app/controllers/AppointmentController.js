import Appointment from "../models/Appointment";
import User from "../models/User";
import File from "../models/File";
import Notification from '../schemas/Notification';
import Mail from '../../lib/Mail';

import * as Yup from "yup";

import { startOfHour, parseISO, isBefore, format, subHours } from "date-fns";
import pt from 'date-fns/locale/pt';

class AppointmentController {
    async store(req, res) {
        const schema = Yup.object().shape({
            date: Yup.date().required(),
            provider_id: Yup.number().required()
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: "Validation fails" });
        }

        const { provider_id, date } = req.body;

        //check if provider_id is provider
        const ckeckIsProvider = await User.findOne({
            where: {
                id: provider_id,
                provider: true
            }
        });

        if (!ckeckIsProvider) {
            return res.status(401).json({
                error: "You can only create appointments with providers."
            });
        }

        if (provider_id == req.userId) {
            return res.status(401).json({
                error: "User can not create appointment yourself."
            });
        }

        const hourStart = startOfHour(parseISO(date));
        //check for past date
        if (isBefore(hourStart, new Date())) {
            return res
                .status(401)
                .json({ error: "Past dates are not permitted." });
        }

        const checkAvailability = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                date: hourStart
            }
        });

        if (checkAvailability) {
            return res.status(401).json({ error: "Date is not avalable." });
        }

        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            date: hourStart
        });

        //notify appointment provider
        const user = await User.findByPk(req.userId);
        const formatDate = format(
            hourStart,
            "'dia' dd 'de' MMMM', às' H:mm'h'",
            { locale: pt }
        )
        await Notification.create({
            content: `Novo agendamento de ${user.name} para ${formatDate}`,
            user: provider_id,

        })

        return res.json(appointment);
    }

    async index(req, res) {
        const { page = 1 } = req.query;
        const appointments = await Appointment.findAll({
            where: { user_id: req.userId, canceled_at: null },
            order: ["date"],
            attributes: ["id", "date"],
            limit: 20,
            offset: (page - 1) * 20,
            include: [
                {
                    model: User,
                    as: "provider",
                    attributes: ["id", "name"],
                    include: [
                        {
                            model: File,
                            as: "avatar",
                            attributes: ["id", "path", "url"]
                        }
                    ]
                }
            ]
        });

        return res.json(appointments);
    }
    async delete(req, res) {

        const appointment = await Appointment.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'provider',
                attributes: ['name', 'email']
            }
            ]
        });

        if (!appointment) {
            return res.json({ error: "Appointment not found." });
        }

        if (appointment.user_id != req.userId) {
            return res.status(401).json({ error: "You don't have permission to cancel this appointment." });
        }

        const dateWithSub = subHours(appointment.date, 2);

        if (isBefore(dateWithSub, new Date())) {
            return res.status(401).json({ error: "You can only cancel appointments 2 hours in advance." });
        }

        appointment.canceled_at = new Date();
        await appointment.save();

        await Mail.sendMail({
            to: `${appointment.provider.name} <${appointment.provider.email}>`,
            subject: 'Cancelamento de agendamento',
            text: 'Você tem um novo agendamento'
        });

        return res.json(appointment);
    }

}

export default new AppointmentController();
