
import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';


class CancellationMail {

    get key() {
        return 'CancellationMail';
    }

    async hanlde({ data }) {
        const { appointment } = data;

        console.log('A fila executou');

        await Mail.sendMail({
            to: `${appointment.provider.name} <${appointment.provider.email}>`,
            subject: "Cancelamento de agendamento",
            template: "cancelation",
            context: {
                provider: appointment.provider.name,
                user: appointment.user.name,
                date: format(
                    parseISO(appointment.date),
                    "'dia' dd 'de' MMMM', às' H:mm'h'",
                    { locale: pt }
                )
            }
        });
    }

}

export default new CancellationMail();
