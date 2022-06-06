const steps = {
  begin: {
    triggers: {
      start: [
        "hello",
        "hi",
        "good",
        "morning",
        "afternoon",
        "night",
        "hola",
        "buen dia",
        "buenas",
        "buenas noches",
        "buenos dias",
        "saludos",
        "buenas tardes",
        "covid",
        "covid19",
        "covid-19",
        "prueba",
        "pcr",
        "test",
        "nombre",
        "saber",
        "quiero",
        "quisiera",
        "duda",
        "pregunta",
        "me llamo",
      ],
    },
    reply: `¡Hola {{title}}! / _Hi {{title}}_!

Por favor escribe tu nombre completo
_Please write your full name._`,
  },
  start: {
    triggers: {
      1: null,
    },
    reply: `Por favor escribe tu nombre completo.
_Please write your full name._`,
    question: {
      label: "Nombre",
      key: "test_fullname",
      type: "string",
    },
  },
  1: {
    reply: `Selecciona tu idioma:
_Select your language:_ 
*1:* English.
*2:* Español.

Escribe *Salir* para finalizar / Write *Exit* to finish.
`,
    triggers: {
      "1:1": ["1", "en", "english", "ingles", "inglés"],
      "1:2": ["2", "es", "spanish", "espanol", "español"],
      end: ["salir", "exit"],
    },
  },
  "1:1": {
    reply: `What service do you need?
*1:* Test Covid-19 to travel.
*2:* Test Covid-19 with symptoms.
*3:* Other service.
*M:* Main menu.

Type your option to continue.
`,
    triggers: {
      "1:1:1": ["1", "travel"],
      "1:1:2": ["2", "symptom"],
      "1:1:3": ["3", "other", "service"],
      1: ["m", "volver", "back"],
    },
  },

  "1:2": {
    reply: `*¿Qué servicio desea?*
*1:* Test Covid-19 para Viaje.
*2:* Test Covid-19 por síntomas.
*3:* Otro servicio.
*M:* Menú principal.

_Escriba la opción deseada para continuar._
`,
    triggers: {
      "1:2:1": ["1", "viaje"],
      "1:2:2": ["2", "sintoma"],
      "1:2:3": ["3", "otro", "servicio"],
      1: ["m", "volver", "back"],
    },
  },

  "1:1:1": {
    reply: `*When do you want to take the test?*
Date and time:
`,
    triggers: {
      "1:1:1:1": null,
    },
    question: {
      label: "Date and Time",
      key: "test_date",
      type: "string",
    },
  },

  "1:2:1": {
    reply: `*¿Cuándo deseas hacer el test?(Sujeto a confirmación)*
Fecha y Hora:
`,
    triggers: {
      "1:2:1:1": null,
    },
    question: {
      label: "Fecha y Hora",
      key: "test_date",
      type: "string",
    },
  },

  "1:1:1:1": {
    reply: `*What hotel are you staying at?* 
_Please enter name and address._`,
    triggers: {
      "1:1:1:2": null,
    },
    question: {
      label: "Hotel",
      key: "test_hotel",
      type: "string",
    },
  },

  "1:2:1:1": {
    reply: `¿En qué hotel te hospedas? 
_Por favor completa nombre y dirección._`,
    triggers: {
      "1:2:1:2": null,
    },
    question: {
      label: "Hotel",
      key: "test_hotel",
      type: "string",
    },
  },

  "1:1:1:2": {
    reply: `*Please enter your room number:*`,
    triggers: {
      "1:1:1:3": null,
    },
    question: {
      label: "Room",
      key: "test_habitacion",
      type: "string",
    },
  },
  "1:2:1:2": {
    reply: `*¿En qué número de habitación realizaremos el test?*`,
    triggers: {
      "1:2:1:3": null,
    },
    question: {
      label: "Habitacion",
      key: "test_habitacion",
      type: "string",
    },
  },

  "1:1:1:3": {
    reply: `*Please enter your email:*`,
    triggers: {
      "1:1:1:4": null,
    },
    question: {
      label: "Email",
      key: "test_email",
      type: "string",
    },
  },
  "1:2:1:3": {
    reply: `*Por favor ingrese su E-Mail:*`,
    triggers: {
      "1:2:1:4": null,
    },
    question: {
      label: "Email",
      key: "test_email",
      type: "string",
    },
  },

  "1:1:1:4": {
    reply: `*Please attach a Photo of your Passport:*`,
    triggers: {
      "1:1:1:5": null,
    },
    isMedia: true,
  },
  "1:2:1:4": {
    reply: `*Por favor adjunta una Foto de tu Pasaporte o DNI:*`,
    triggers: {
      "1:2:1:5": null,
    },
    isMedia: true,
  },

  "1:1:1:5": {
    reply: `*Thanks! This service is paid in cash at the visit. Its value is AR$8000 / 40USD.-*

*1:* Confirm.
*2:* Cancel.
*M:* Main menu.

Type your option to continue.
`,
    triggers: {
      "1:1:1:6": ["1", "si", "yes"],
      end: ["2", "no"],
      1: ["m", "volver", "back"],
    },
  },
  "1:2:1:5": {
    reply: `*¡Gracias! El servicio se abona en efectivo al momento de la visita.
y su valor es de AR$8000 / 40USD.- (AR$ 5500 con DNI Argentino)*


*1*: Confirmar.
*2*: Cancelar.
*M*: Menú principal.

_Escriba la opción deseada para continuar._`,
    triggers: {
      "1:2:1:6": ["1", "si", "yes"],
      end: ["2", "no"],
      1: ["m", "volver", "back"],
    },
  },

  "1:1:1:6": {
    reply: `*Thanks! We received your information and the service is confirmed.*

We will contact you shortly to coordinate our visit. The results will be delivered by email within 12 hours after taking the sample. Please, if required, request proof of payment from the technician. 

Thank you very much!
`,
    triggers: {
      end: null,
    },
    sendFormData: true,
  },
  "1:2:1:6": {
    reply: `*¡Gracias! Recibimos su información y el servicio está confirmado.*

Nos comunicaremos a la brevedad con usted para coordinar nuestra visita. Los resultados serán entregados por email dentro de las 12 horas posteriores a la toma de la muestra. Por favor, en caso de requerir solicite comprobante de pago al técnico.

¡Muchas gracias!
`,
    triggers: {
      end: null,
    },
    sendFormData: true,
  },

  "1:1:2": {
    reply: `*Have you had symptoms for more than 48 hours?*
    
*1:* Yes.
*2:* No.
*3:* I'm not sure.
*M:* Main menu.

_Type your option to continue._`,
    triggers: {
      "1:1:1": ["1", "si", "yes"],
      "1:1:2:2": ["2", "no"],
      "1:1:1:": ["3", "not sure"],
      1: ["m", "volver", "back"],
    },
  },
  "1:2:2": {
    reply: `*¿Hace más de 48 horas que presenta síntomas?*
    
*1:* Si.
*2:* No.
*3:* No estoy seguro(a).
*M:* Menú PRINCIPAL.

_Escriba la opción deseada para continuar._`,
    triggers: {
      "1:2:1": ["1", "si", "yes"],
      "1:2:2:2": ["2", "no"],
      "1:2:1:": ["3", "no estoy"],
      1: ["m", "volver", "back"],
    },
  },

  "1:1:2:2": {
    reply: `Does not comply with the evolution times to carry out the test. *Do you want to continue anyway?*`,
    triggers: {
      "1:1": ["1", "si", "yes"],
      end: ["2", "no"],
      1: ["m", "volver", "back"],
    },
  },
  "1:2:2:2": {
    reply: `No cumple con los tiempos de evolución para realizar el test. *¿Desea continuar de todas formas?*
    
*1:* Si.
*2:* No.
*M:* Menú principal.

_Escriba la opción deseada para continuar._`,
    triggers: {
      "1:2:1": ["1", "si", "yes"],
      end: ["2", "no"],
      1: ["m", "volver", "back"],
    },
  },

  "1:1:3": {
    reply: `*Please describe the service you need and we will contact you shortly.*`,
    triggers: {
      end: null,
    },
    question: {
      label: "Servicio",
      key: "custom_service",
      type: "string",
    },
  },
  "1:2:3": {
    reply: `*Por favor, descríbanos el servicio que desea y nos estaremos contactando con usted a la brevedad.*`,
    triggers: {
      end: null,
    },
    question: {
      label: "Servicio",
      key: "custom_service",
      type: "string",
    },
  },

  end: {
    reply: `*Muchas Gracias!*
_Thank you very much!_`,
    triggers: {
      end: null,
    },
    end: true,
  },
};

export default steps;
